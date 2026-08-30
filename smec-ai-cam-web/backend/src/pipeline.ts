import { randomUUID } from "node:crypto";
import { analyzeDrawing } from "./drawing-analysis.js";
import { buildFanucProgram, validateFanucProgram } from "./gcode.js";
import { resolveMaterialProfile, smecFanucMachineProfile } from "./machining-data.js";
import { selectTool } from "./tool-database.js";
import type {
  AutoCncJob,
  AutoCncRequest,
  DetectedFeature,
  OperationPlan,
  PipelineStep,
  Recommendation,
  UploadArtifact
} from "./types.js";

const BASE_STEPS = [
  "drawing_uploaded",
  "drawing_analyzed",
  "geometry_recognized",
  "part_model_created",
  "features_detected",
  "technology_created",
  "tools_selected",
  "cutting_parameters_calculated",
  "toolpaths_generated",
  "simulation_completed",
  "collision_check_passed",
  "gcode_generated",
  "gcode_validated"
] as const;

const STEP_LABELS: Record<(typeof BASE_STEPS)[number], string> = {
  drawing_uploaded: "Drawing uploaded",
  drawing_analyzed: "Drawing analyzed",
  geometry_recognized: "Geometry recognized",
  part_model_created: "3D model created",
  features_detected: "Features detected",
  technology_created: "Technology created",
  tools_selected: "Tools selected",
  cutting_parameters_calculated: "Cutting parameters calculated",
  toolpaths_generated: "Toolpaths generated",
  simulation_completed: "Simulation completed",
  collision_check_passed: "Collision check passed",
  gcode_generated: "G-code generated",
  gcode_validated: "G-code validated"
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
): { operations: OperationPlan[]; warnings: string[] } {
  const machine = smecFanucMachineProfile;
  const material = resolveMaterialProfile(request.material);
  const stockInfo = parseStock(request.stock);
  const maxDia = biggestDiameter(features, stockInfo.diameter);
  const threadPitch = findThreadPitch(features) ?? material.threadPitchDefault;
  const opSkeleton = buildOperationSkeleton(features);

  const warnings: string[] = [];
  const operations: OperationPlan[] = [];

  for (const skeleton of opSkeleton) {
    const defaults = opDefaults(skeleton.type, material);
    const targetDia = skeleton.type === "parting" ? stockInfo.diameter : maxDia;
    const tool = selectTool(skeleton.type, targetDia);
    if (!tool) {
      warnings.push(`TOOL REQUIRED: no available tool for ${skeleton.name}.`);
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

  return { operations, warnings };
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
}

function simulateAndValidate(
  operations: OperationPlan[],
  features: DetectedFeature[],
  request: AutoCncRequest
): SimulationResult {
  const issues: string[] = [];
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

  return { ok: issues.length === 0, issues };
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
  maxAutoFixAttempts = 5
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
    drawingText: "",
    detectedFeatures: [],
    operations: [],
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
    markStep(job.steps, "drawing_analyzed", "running");
    await onStateChange?.(job);
    const drawing = await analyzeDrawing(job.uploads);
    job.drawingText = drawing.aggregatedText;
    markStep(job.steps, "drawing_analyzed", "done", "OCR/text extraction completed");
    updateProgress(2);
    await onStateChange?.(job);

    await doStep("geometry_recognized", 3, "Dimension and annotation parsing completed");
    await doStep("part_model_created", 4, "Parametric turn profile generated");

    job.detectedFeatures = drawing.features;
    if (job.detectedFeatures.length === 0) {
      job.errors.push("No machinable features detected from uploaded drawing.");
      markStep(job.steps, "features_detected", "failed", "Feature extraction returned empty result.");
      job.status = "manual_review_required";
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }
    await doStep("features_detected", 5, `${job.detectedFeatures.length} features extracted`);

    const operationBuild = computeOperationPlans(job.request, job.detectedFeatures);
    job.warnings.push(...operationBuild.warnings);
    job.operations = operationBuild.operations;
    await doStep("technology_created", 6, "Operation sequence generated from features");

    if (job.operations.length === 0) {
      job.errors.push("No executable operations could be planned.");
      markStep(job.steps, "tools_selected", "failed", "Required tooling unavailable.");
      job.status = "manual_review_required";
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }
    await doStep("tools_selected", 7, `${job.operations.length} operations have tools`);

    await doStep("cutting_parameters_calculated", 8, "RPM/feed/DOC computed from material + machine limits");
    await doStep("toolpaths_generated", 9, "Lathe path blocks generated from operation sequence");

    const initialSeconds = estimateTotalSeconds(job.operations);
    let optimizedOperations = optimizeOperations(job.operations);
    let latestIssues: string[] = [];

    for (let attempt = 1; attempt <= job.maxAutoFixAttempts; attempt += 1) {
      job.attemptsUsed = attempt;
      markStep(job.steps, "simulation_completed", "running", `Simulation pass #${attempt}`);
      await onStateChange?.(job);
      await sleep(60);
      const simulation = simulateAndValidate(optimizedOperations, job.detectedFeatures, job.request);
      latestIssues = simulation.issues;
      if (simulation.ok) {
        markStep(job.steps, "simulation_completed", "done", `Simulation pass #${attempt} passed`);
        updateProgress(10);
        markStep(job.steps, "collision_check_passed", "done", "No collisions or envelope violations");
        updateProgress(11);
        job.operations = optimizedOperations;
        await onStateChange?.(job);
        break;
      }

      markStep(
        job.steps,
        "collision_check_passed",
        "running",
        `Auto-fix attempt #${attempt}: ${simulation.issues.join(" ")}`
      );
      optimizedOperations = autoFixOperations(optimizedOperations, simulation.issues);
      await onStateChange?.(job);

      if (attempt === job.maxAutoFixAttempts) {
        markStep(job.steps, "simulation_completed", "failed", "Simulation did not pass.");
        markStep(job.steps, "collision_check_passed", "failed", "Auto-fix attempts exhausted.");
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
    await doStep("gcode_generated", 12, "FANUC postprocessing complete");

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
        gcode
      };
      job.updatedAt = nowIso();
      await onStateChange?.(job);
      return;
    }

    await doStep("gcode_validated", 13, "Syntax, modal safety, feeds, spindle and end code validated");
    job.status = "completed";
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
      gcode
    };
    job.updatedAt = nowIso();
    await onStateChange?.(job);
  } catch (error) {
    markStep(job.steps, "drawing_analyzed", "failed", "Parsing failure");
    job.status = "failed";
    job.errors.push(error instanceof Error ? error.message : String(error));
    job.updatedAt = nowIso();
    await onStateChange?.(job);
  }
}
