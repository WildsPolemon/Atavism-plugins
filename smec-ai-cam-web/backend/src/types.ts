export type UploadKind = "image" | "pdf" | "dxf" | "step";

export interface UploadArtifact {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadKind;
  contentBase64: string;
}

export interface AutoCncRequest {
  machine: "SMEC + FANUC";
  material: string;
  stock: string;
  quantity: number;
  advancedMode: boolean;
  manualOverrides?: {
    operationOrder?: string[];
    rpmLimit?: number;
    feedLimit?: number;
    customDoc?: number;
  };
}

export type StepState = "pending" | "running" | "done" | "failed";

export interface PipelineStep {
  id: string;
  label: string;
  state: StepState;
  details?: string;
  updatedAt: string;
}

export interface DetectedFeature {
  name: string;
  value: string;
  numericValue?: number;
  unit?: "mm" | "deg" | "pitch" | "text";
}

export interface OperationPlan {
  id: string;
  type:
    | "facing"
    | "rough_turning"
    | "finish_turning"
    | "grooving"
    | "threading"
    | "drilling"
    | "parting";
  name: string;
  tool: string;
  toolId: string;
  rpm: number;
  cuttingSpeed: number;
  feedPerRev: number;
  feedRate: number;
  doc: number;
  passes: number;
  estimatedSeconds: number;
}

export interface Recommendation {
  title: string;
  reason: string;
  impact: string;
}

export interface MissingTool {
  operationType: OperationPlan["type"];
  operationName: string;
  recommendedLabel: string;
}

export interface AutoFixAttempt {
  attempt: number;
  stage: string;
  issue: string;
  action: string;
  fixed: boolean;
}

export interface SimulationCheck {
  label: string;
  passed: boolean;
  details: string;
}

export interface SimulationReport {
  checks: SimulationCheck[];
  iterations: number;
  stable: boolean;
}

export interface FinalProgram {
  machine: string;
  controller: string;
  material: string;
  operations: number;
  tools: number;
  stock: string;
  quantity: number;
  machiningTimeInitial: string;
  machiningTimeOptimized: string;
  saved: string;
  collisions: number;
  warnings: number;
  gcodeStatus: "VALID" | "INVALID";
  gcode: string;
  simulationReport: SimulationReport;
  operatorApproved: boolean;
}

export type JobStatus =
  | "queued"
  | "running"
  | "manual_review_required"
  | "completed"
  | "failed";

export interface AutoCncJob {
  id: string;
  request: AutoCncRequest;
  uploads: UploadArtifact[];
  status: JobStatus;
  progressPercent: number;
  steps: PipelineStep[];
  attemptsUsed: number;
  maxAutoFixAttempts: number;
  optimizationIterations: number;
  maxOptimizationIterations: number;
  drawingText: string;
  detectedFeatures: DetectedFeature[];
  operations: OperationPlan[];
  missingTools: MissingTool[];
  autoFixAttempts: AutoFixAttempt[];
  recommendations: Recommendation[];
  createdAt: string;
  updatedAt: string;
  finalProgram?: FinalProgram;
  warnings: string[];
  errors: string[];
}
