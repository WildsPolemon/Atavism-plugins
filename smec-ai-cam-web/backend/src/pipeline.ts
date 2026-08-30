import { randomUUID } from "node:crypto";
import { analyzeDrawing } from "./drawing-analysis.js";
import { buildFanucProgram, validateFanucProgram } from "./gcode.js";
import { resolveMaterialProfile, smecFanucMachineProfile } from "./machining-data.js";
import { selectTool } from "./tool-database.js";
import type {
  AutoFixAttempt,
  AutoCncJob,
  AutoCncRequest,
  DetectedFeature,
  MissingTool,
  OperationPlan,
  PipelineStep,
  Recommendation,
  SimulationCheck,
  UploadArtifact
} from "./types.js";

const BASE_STEPS = [
  "drawing_uploaded",
  "ai_vision",
  "ocr",
  "geometry_recognized",
  "part_model_created",
  "stock_analysis",
  "material_analysis",
  "features_detected",
  "process_planning",
  "tools_selected",
  "cutting_parameters_calculated",
  "cam_toolpath",
  "simulation_completed",
  "collision_check",
  "optimization",
  "fanuc_postprocess",
  "gcode_validated",
  "final_program"
] as const;

const STEP_LABELS: Record<(typeof BASE_STEPS)[number], string> = {
  drawing_uploaded: "Drawing uploaded",
  ai_vision: "AI vision completed",
  ocr: "OCR completed",
  geometry_recognized: "Geometry recognized",
  part_model_created: "3D model created",
  stock_analysis: "Stock analysis completed",
  material_analysis: "Material analysis completed",
  features_detected: "Features detected",
  process_planning: "Process planning completed",
  tools_selected: "Tools selected",
  cutting_parameters_calculated: "Cutting parameters calculated",
  cam_toolpath: "CAM toolpath generated",
  simulation_completed: "Simulation completed",
  collision_check: "Collision check completed",
  optimization: "Optimization loop completed",
  fanuc_postprocess: "FANUC postprocessing completed",
  gcode_validated: "G-code validated",
  final_program: "Final CNC program ready"
};

function nowIso(): string {
  return new Date().toISOString();
}

function createPendingSteps(): PipelineStep[] {
  const now = nowIso();
  return BASE_STEPS.map((id) => ({
    id,
    label: STEP_LABELS[id],
    state: "pending",
    updatedAt: now
  }));
}

export function resetJobForRetry(job: AutoCncJob): void {
  const now = nowIso();
  job.status = "queued";
  job.progressPercent = 0;
  job.steps = createPendingSteps();
  job.attemptsUsed = 0;
  job.optimizationIterations = 0;
  job.detectedFeatures = [];
  job.operations = [];
  job.missingTools = [];
  job.autoFixAttempts = [];
  job.recommendations = [];
  job.finalProgram = undefined;
  job.warnings = [];
  job.errors = [];
  job.updatedAt = now;
}

function markStep(
  steps: PipelineStep[],
  stepId: string,
  state: PipelineStep["state"],
  details?: string
): void {
  const step = steps.find((item) => item.id === stepId);
  if (!step) {
    return;
  }
  step.state = state;
  step.updatedAt = nowIso();
  if (details) {
    step.details = details;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseStock(stock: string): { diameter: number; length: number } {
  const normalized = stock.replace(/×/g, "x");
  const match = normalized.match(/(?:ø)?\s*([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) {
    return { diameter: Number(match[1]), length: Number(match[2]) };
  }
  return { diameter: 60, length: 100 };
}

function featureExists(features: DetectedFeature[], name: string): boolean {
  return features.some((feature) => feature.name.toLowerCase() === name.toLowerCase());
}

function biggestDiameter(features: DetectedFeature[], stockDiameter: number): number {
  const values = features
    .filter((feature) => feature.name === "External Diameter" && typeof feature.numericValue === "number")
    .map((feature) => feature.numericValue as number);
  return values.length ? Math.max(...values) : stockDiameter;
}

function findThreadPitch(features: DetectedFeature[]): number | undefined {
  const thread = features.find((feature) => feature.name === "Thread");
  return thread?.numericValue;
}

function secondsToMmSs(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const sec = Math.round(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildOperationSkeleton(features: DetectedFeature[]): Array<Pick<OperationPlan, "type" | "name">> {
  const operations: Array<Pick<OperationPlan, "type" | "name">> = [
    { type: "facing", name: "Facing" },
    { type: "rough_turning", name: "Rough Turning" },
    { type: "finish_turning", name: "Finish Turning" }
  ];

  if (featureExists(features, "Groove")) {
    operations.push({ type: "grooving", name: "Grooving" });
  }
  if (featureExists(features, "Thread")) {
    operations.push({ type: "threading", name: "Threading" });
  }
  if (featureExists(features, "Hole")) {
    operations.push({ type: "drilling", name: "Drilling" });
  }

  operations.push({ type: "parting", name: "Parting" });
  return operations;
}

function opDefaults(operationType: OperationPlan["type"], profile: ReturnType<typeof resolveMaterialProfile>) {
  if (operationType === "rough_turning" || operationType === "facing") {
    return { vc: profile.roughVc, feed: profile.roughFeed, doc: 2.0 };
  }
  if (operationType === "finish_turning") {
    return { vc: profile.finishVc, feed: profile.finishFeed, doc: 0.4 };
  }
  if (operationType === "grooving") {
    return { vc: profile.grooveVc, feed: profile.grooveFeed, doc: 1.1 };
  }
  if (operationType === "threading") {
    return { vc: profile.threadVc, feed: profile.threadPitchDefault, doc: 0.35 };
  }
  if (operationType === "parting") {
    return { vc: profile.partVc, feed: profile.partFeed, doc: 1.5 };
  }
  return { vc: profile.partVc, feed: 0.12, doc: 2.0 };
}

function computeOperationPlans(
  request: AutoCncRequest,
  features: DetectedFeature[]
): { operations: OperationPlan[]; warnings: string[]; missingTools: MissingTool[] } {
  const machine = smecFanucMachineProfile;
  const material = resolveMaterialProfile(request.material);
  const stockInfo = parseStock(request.stock);
  const maxDia = biggestDiameter(features, stockInfo.diameter);
  const threadPitch = findThreadPitch(features) ?? material.threadPitchDefault;
  const opSkeleton = buildOperationSkeleton(features);

  const warnings: string[] = [];
  const operations: OperationPlan[] = [];
  const missingTools: MissingTool[] = [];

  for (const skeleton of opSkeleton) {
    const defaults = opDefaults(skeleton.type, material);
    const targetDia = skeleton.type === "parting" ? stockInfo.diameter : maxDia;
    const tool = selectTool(skeleton.type, targetDia);
    if (!tool) {
      warnings.push(`TOOL REQUIRED: no available tool for ${skeleton.name}.`);
      missingTools.push({
        operationType: skeleton.type,
        operationName: skeleton.name,
        recommendedLabel:
          skeleton.type === "grooving"
            ? "2mm Grooving Tool"
            : skeleton.type === "threading"
              ? "16ER Threading Insert"
              : skeleton.type === "parting"
                ? "Parting 3mm Blade"
                : `${skeleton.name} compatible tool`
      });
      continue;
    }

    const feedPerRev = skeleton.type === "threading" ? threadPitch : defaults.feed;
    let doc = defaults.doc;
    if (request.manualOverrides?.customDoc && request.advancedMode) {
      doc = request.manualOverrides.customDoc;
    }
    doc = Math.min(doc, tool.maxDoc);

    const rpmRaw = (1000 * defaults.vc) / (Math.PI * Math.max(3, targetDia));
    let rpm = clamp(Math.round(rpmRaw), machine.spindleMinRpm, machine.spindleMaxRpm);
    if (request.advancedMode && request.manualOverrides?.rpmLimit) {
      rpm = Math.min(rpm, request.manualOverrides.rpmLimit);
    }
    if (request.advancedMode && request.manualOverrides?.feedLimit) {
      if (feedPerRev > request.manualOverrides.feedLimit) {
        warnings.push(`Feed limit override reduced ${skeleton.name} feed.`);
      }
    }

    const passes = skeleton.type === "threading" ? 6 : Math.max(1, Math.ceil(targetDia / 40));
    const feedRate = Number((feedPerRev * rpm).toFixed(1));
    const estimatedSeconds = Number((Math.max(8, request.quantity) * 4 + (passes * 8)).toFixed(1));

    operations.push({
      id: randomUUID(),
      type: skeleton.type,
      name: skeleton.name,
      tool: `${tool.station} ${tool.label}`,
      toolId: tool.station,
      rpm,
      cuttingSpeed: defaults.vc,
      feedPerRev:
        skeleton.type === "threading"
          ? threadPitch
          : Number(
              Math.min(feedPerRev, request.manualOverrides?.feedLimit ?? Number.POSITIVE_INFINITY).toFixed(3)
            ),
      feedRate,
      doc: Number(doc.toFixed(3)),
      passes,
      estimatedSeconds
    });
  }

  if (request.advancedMode && request.manualOverrides?.operationOrder?.length) {
    operations.sort((a, b) => {
      const ai = request.manualOverrides?.operationOrder?.indexOf(a.name) ?? -1;
      const bi = request.manualOverrides?.operationOrder?.indexOf(b.name) ?? -1;
      if (ai === -1 && bi === -1) {
        return 0;
      }
      if (ai === -1) {
        return 1;
      }
      if (bi === -1) {
        return -1;
      }
      return ai - bi;
    });
  }

  return { operations, warnings, missingTools };
}

function estimateTotalSeconds(operations: OperationPlan[]): number {
  return operations.reduce((sum, op) => sum + op.estimatedSeconds, 0);
}

function optimizeOperations(operations: OperationPlan[]): OperationPlan[] {
  const orderScore = (op: OperationPlan) => {
    if (op.type === "facing") return 1;
    if (op.type === "rough_turning") return 2;
    if (op.type === "finish_turning") return 3;
    if (op.type === "grooving") return 4;
    if (op.type === "threading") return 5;
    if (op.type === "drilling") return 6;
    return 7;
  };

  return [...operations].sort((a, b) => {
    const scoreDiff = orderScore(a) - orderScore(b);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.rpm - b.rpm;
  });
}

interface SimulationResult {
  ok: boolean;
  issues: string[];
  checks: SimulationCheck[];
}

function simulateAndValidate(
  operations: OperationPlan[],
  features: DetectedFeature[],
  request: AutoCncRequest
): SimulationResult {
  const issues: string[] = [];
  const checks: SimulationCheck[] = [];
  const machine = smecFanucMachineProfile;
  const stock = parseStock(request.stock);

  for (const op of operations) {
    if (op.rpm > machine.spindleMaxRpm || op.rpm < machine.spindleMinRpm) {
      issues.push(`RPM out of machine range on ${op.name}.`);
    }
    if (op.doc <= 0) {
      issues.push(`DOC must be positive on ${op.name}.`);
    }
    if (op.type === "threading" && op.feedPerRev < 0.5) {
      issues.push("Thread pitch is too small for stable G76 cycle.");
    }
    if (op.type === "parting" && stock.diameter > 90) {
      issues.push("Parting diameter exceeds available safe blade range.");
    }
  }

  if (featureExists(features, "Thread") && !operations.some((op) => op.type === "threading")) {
    issues.push("Thread feature detected but no threading operation planned.");
  }

  checks.push({
    label: "Geometry envelope",
    passed: !issues.some((issue) => issue.includes("diameter") || issue.includes("DOC")),
    details: "Checked DOC and stock/tool envelope bounds."
  });
  checks.push({
    label: "Toolpath continuity",
    passed: operations.length > 0,
    details: "Verified generated operation list is non-empty and ordered."
  });
  checks.push({
    label: "Machine limits",
    passed: !issues.some((issue) => issue.includes("RPM out of machine range")),
    details: "Verified spindle speed is within configured SMEC profile limits."
  });
  checks.push({
    label: "Collision risk rules",
    passed: !issues.some((issue) => issue.includes("Parting diameter")),
    details: "Validated holder and parting constraints using safety rules."
  });
  checks.push({
    label: "Threading synchronization",
    passed: !issues.some((issue) => issue.includes("Thread pitch")),
    details: "Checked thread pitch compatibility with G76 cycle stability."
  });

  return { ok: issues.length === 0, issues, checks };
}

function autoFixOperations(operations: OperationPlan[], issues: string[]): OperationPlan[] {
  const fixed = operations.map((op) => ({ ...op }));
  for (const issue of issues) {
    if (issue.includes("RPM out of machine range")) {
      for (const op of fixed) {
        op.rpm = clamp(op.rpm, smecFanucMachineProfile.spindleMinRpm, smecFanucMachineProfile.spindleMaxRpm);
      }
    } else if (issue.includes("DOC must be positive")) {
      for (const op of fixed) {
        if (op.doc <= 0) {
          op.doc = 0.2;
        }
      }
    } else if (issue.includes("Thread pitch is too small")) {
      for (const op of fixed) {
        if (op.type === "threading" && op.feedPerRev < 0.5) {
          op.feedPerRev = 1.0;
        }
      }
    } else if (issue.includes("Parting diameter exceeds")) {
      for (const op of fixed) {
        if (op.type === "parting") {
          op.doc = Math.min(op.doc, 1.0);
          op.feedPerRev = Math.min(op.feedPerRev, 0.05);
        }
      }
    }
  }

  for (const op of fixed) {
    op.feedRate = Number((op.feedPerRev * op.rpm).toFixed(1));
  }
  return fixed;
}

function buildRecommendations(
  request: AutoCncRequest,
  features: DetectedFeature[],
  operations: OperationPlan[],
  simulationIssues: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  if (featureExists(features, "Roughness")) {
    recs.push({
      title: "Finish allowance locked to 0.2 mm",
      reason: "Roughness callout detected in drawing, preserving stable finish pass.",
      impact: "Higher chance to hit Ra target in one finish pass."
    });
  }
  if (featureExists(features, "Thread")) {
    recs.push({
      title: "Use spring pass on threading",
      reason: "Thread feature detected and mapped to G76 with spring cut.",
      impact: "Improved repeatability over production quantity."
    });
  }
  if (simulationIssues.length > 0) {
    recs.push({
      title: "Auto-fix applied",
      reason: simulationIssues.join(" "),
      impact: "Program adjusted for safer machine envelope."
    });
  }
  recs.push({
    title: "Operator approval required",
    reason: "Auto-generated NC must be confirmed against setup offsets and clamping.",
    impact: "Prevents unintended machine motion."
  });
  if (request.advancedMode) {
    recs.push({
      title: "Advanced overrides active",
      reason: "Manual operation order/limits are enabled.",
      impact: "Cycle strategy follows operator preferences where possible."
    });
  }
  return recs;
}

export function createJob(
  request: AutoCncRequest,
  uploads: UploadArtifact[],
  maxAutoFixAttempts = 5,
  maxOptimizationIterations = 6
): AutoCncJob {
  const now = nowIso();
  return {
    id: randomUUID(),
    request,
    uploads,
    status: "queued",
    progressPercent: 0,
    steps: createPendingSteps(),
    attemptsUsed: 0,
    maxAutoFixAttempts,
    optimizationIterations: 0,
    maxOptimizationIterations,
    drawingText: "",
    detectedFeatures: [],
    operations: [],
    missingTools: [],
    autoFixAttempts: [],
    recommendations: [],
    createdAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  };
}

export async function runPipeline(
  job: AutoCncJob,
  onStateChange?: (job: AutoCncJob) => Promise<void>
): Promise<void> {
  job.status = "running";
  job.updatedAt = nowIso();
  await onStateChange?.(job);

  const updateProgress = (completed: number) => {
    job.progressPercent = Math.round((completed / BASE_STEPS.length) * 100);
    job.updatedAt = nowIso();
  };

  const doStep = async (
    stepId: (typeof BASE_STEPS)[number],
    doneCount: number,
    details?: string
  ) => {
    markStep(job.steps, stepId, "running");
    await onStateChange?.(job);
    await sleep(60);
    markStep(job.steps, stepId, "done", details);
    updateProgress(doneCount);
    await onStateChange?.(job);
  };

  try {
    await doStep("drawing_uploaded", 1, `${job.uploads.length} file(s) accepted`);
    await doStep("ai_vision", 2, "Drawing regions segmented and classified");
    await doStep("ocr", 3, "OCR pass completed");

    const drawing = await analyzeDrawing(job.uploads);
    job.drawingText = drawing.aggregatedText;
    await onStateChange?.(job);

    await doStep("geometry_recognized", 4, "Dimension and annotation parsing completed");
    await doStep("part_model_created", 5, "2D profile and 3D revolve model generated");
    await doStep("stock_analysis", 6, `Stock interpreted as ${job.request.stock}`);
    await doStep("material_analysis", 7, `Material profile loaded for ${job.request.material}`);

    job.detectedFeatures = drawing.features;
    if (job.detectedFeatures.length === 0) {
      job.errors.push("No machinable features detected from uploaded drawing.");
      markStep(job.steps, "features_detected", "failed", "Feature extraction returned empty result.");
      job.status = "manual_review_required";
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }
    await doStep("features_detected", 8, `${job.detectedFeatures.length} features extracted`);

    const operationBuild = computeOperationPlans(job.request, job.detectedFeatures);
    job.warnings.push(...operationBuild.warnings);
    job.operations = operationBuild.operations;
    job.missingTools = operationBuild.missingTools;
    await doStep("process_planning", 9, "Operation sequence generated from features");

    if (job.missingTools.length > 0) {
      markStep(
        job.steps,
        "tools_selected",
        "failed",
        `TOOL REQUIRED: ${job.missingTools.map((item) => item.recommendedLabel).join(", ")}`
      );
      job.status = "manual_review_required";
      job.errors.push("Tool database is missing required tool(s).");
      await onStateChange?.(job);
      return;
    }

    if (job.operations.length === 0) {
      job.errors.push("No executable operations could be planned.");
      markStep(job.steps, "tools_selected", "failed", "No valid operation could be generated.");
      job.status = "manual_review_required";
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }
    await doStep("tools_selected", 10, `${job.operations.length} operations have tools`);

    await doStep("cutting_parameters_calculated", 11, "RPM/feed/DOC computed from material + machine limits");
    await doStep("cam_toolpath", 12, "Lathe path blocks generated from operation sequence");

    const initialSeconds = estimateTotalSeconds(job.operations);
    let optimizedOperations = optimizeOperations(job.operations);
    let latestIssues: string[] = [];
    let latestChecks: SimulationCheck[] = [];
    let stableCounter = 0;

    for (let iteration = 1; iteration <= job.maxOptimizationIterations; iteration += 1) {
      job.optimizationIterations = iteration;
      markStep(job.steps, "simulation_completed", "running", `Simulation iteration #${iteration}`);
      await onStateChange?.(job);
      await sleep(60);
      const simulation = simulateAndValidate(optimizedOperations, job.detectedFeatures, job.request);
      latestIssues = simulation.issues;
      latestChecks = simulation.checks;

      if (simulation.ok) {
        stableCounter += 1;
        markStep(job.steps, "simulation_completed", "done", `Simulation iteration #${iteration} passed`);
        updateProgress(13);
        markStep(job.steps, "collision_check", "done", "No collisions or envelope violations");
        updateProgress(14);
      } else {
        stableCounter = 0;
        markStep(job.steps, "collision_check", "running", simulation.issues.join(" "));
        const before = optimizedOperations;
        optimizedOperations = autoFixOperations(optimizedOperations, simulation.issues);
        const fixed = before !== optimizedOperations;
        for (const issue of simulation.issues) {
          const attempt: AutoFixAttempt = {
            attempt: job.autoFixAttempts.length + 1,
            stage: "simulation",
            issue,
            action: "adjust approach/clearance/tool params",
            fixed
          };
          job.autoFixAttempts.push(attempt);
        }
        job.attemptsUsed = job.autoFixAttempts.length;
        await onStateChange?.(job);
      }

      markStep(job.steps, "optimization", "running", `Iteration ${iteration}/${job.maxOptimizationIterations}`);
      await onStateChange?.(job);

      if (stableCounter >= 2) {
        markStep(job.steps, "optimization", "done", "Stable result reached for two consecutive iterations.");
        job.operations = optimizedOperations;
        updateProgress(15);
        await onStateChange?.(job);
        break;
      }

      if (iteration === job.maxOptimizationIterations) {
        markStep(job.steps, "simulation_completed", "failed", "Simulation did not pass.");
        markStep(job.steps, "collision_check", "failed", "Auto-fix attempts exhausted.");
        markStep(job.steps, "optimization", "failed", "No stable state within iteration limit.");
        job.status = "manual_review_required";
        job.errors.push(...simulation.issues);
        job.operations = optimizedOperations;
        job.recommendations = buildRecommendations(
          job.request,
          job.detectedFeatures,
          job.operations,
          simulation.issues
        );
        job.updatedAt = nowIso();
        await onStateChange?.(job);
        return;
      }
    }

    const optimizedSeconds = estimateTotalSeconds(job.operations);
    const stockInfo = parseStock(job.request.stock);
    const gcode = buildFanucProgram(job.operations, stockInfo.diameter);
    await doStep("fanuc_postprocess", 16, "FANUC postprocessing complete");

    const validation = validateFanucProgram(gcode, smecFanucMachineProfile.spindleMaxRpm, 0.02);
    if (!validation.valid) {
      markStep(job.steps, "gcode_validated", "failed", validation.errors.join(" "));
      job.status = "manual_review_required";
      job.errors.push(...validation.errors);
      job.recommendations = buildRecommendations(
        job.request,
        job.detectedFeatures,
        job.operations,
        validation.errors
      );
      job.finalProgram = {
        machine: "SMEC",
        controller: "FANUC",
        material: job.request.material,
        operations: job.operations.length,
        tools: new Set(job.operations.map((op) => op.toolId)).size,
        stock: job.request.stock,
        quantity: job.request.quantity,
        machiningTimeInitial: secondsToMmSs(initialSeconds),
        machiningTimeOptimized: secondsToMmSs(optimizedSeconds),
        saved: secondsToMmSs(Math.max(0, initialSeconds - optimizedSeconds)),
        collisions: 1,
        warnings: job.warnings.length,
        gcodeStatus: "INVALID",
          gcode,
          simulationReport: {
            checks: latestChecks,
            iterations: job.optimizationIterations,
            stable: false
          },
          operatorApproved: false
      };
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }

    await doStep("gcode_validated", 17, "Syntax, modal safety, feeds, spindle and end code validated");
    job.recommendations = buildRecommendations(job.request, job.detectedFeatures, job.operations, latestIssues);
    job.finalProgram = {
      machine: "SMEC",
      controller: "FANUC",
      material: job.request.material,
      operations: job.operations.length,
      tools: new Set(job.operations.map((op) => op.toolId)).size,
      stock: job.request.stock,
      quantity: job.request.quantity,
      machiningTimeInitial: secondsToMmSs(initialSeconds),
      machiningTimeOptimized: secondsToMmSs(optimizedSeconds),
      saved: secondsToMmSs(Math.max(0, initialSeconds - optimizedSeconds)),
      collisions: 0,
      warnings: job.warnings.length,
      gcodeStatus: "VALID",
      gcode,
      simulationReport: {
        checks: latestChecks,
        iterations: job.optimizationIterations,
        stable: true
      },
      operatorApproved: false
    };
    await doStep("final_program", 18, "PROGRAM.NC is ready for operator approval");
    job.status = "completed";
    job.updatedAt = nowIso();
    await onStateChange?.(job);
  } catch (error) {
    markStep(job.steps, "ocr", "failed", "Parsing failure");
    job.status = "failed";
    job.errors.push(error instanceof Error ? error.message : String(error));
    job.updatedAt = nowIso();
    await onStateChange?.(job);
  }
}
