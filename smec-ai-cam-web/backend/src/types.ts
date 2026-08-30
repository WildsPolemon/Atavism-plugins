export type UploadKind = "image" | "pdf" | "dxf" | "step";

export interface UploadArtifact {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadKind;
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
}

export interface OperationPlan {
  name: string;
  tool: string;
  rpm: number;
  feedPerRev: number;
  doc: number;
  passes: number;
}

export interface Recommendation {
  title: string;
  reason: string;
  impact: string;
}

export interface FinalProgram {
  machine: string;
  controller: string;
  material: string;
  operations: number;
  tools: number;
  machiningTimeInitial: string;
  machiningTimeOptimized: string;
  saved: string;
  collisions: number;
  warnings: number;
  gcodeStatus: "VALID" | "INVALID";
  gcode: string;
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
  detectedFeatures: DetectedFeature[];
  operations: OperationPlan[];
  recommendations: Recommendation[];
  createdAt: string;
  updatedAt: string;
  finalProgram?: FinalProgram;
  warnings: string[];
  errors: string[];
}
