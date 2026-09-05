import express from "express";
import cors from "cors";
import multer from "multer";
import { z } from "zod";
import { createJob, resetJobForRetry, runPipeline } from "./pipeline.js";
import { addOrEnableTool, listTools } from "./tool-database.js";
import type { JobStore } from "./store.js";
import type { UploadArtifact, UploadKind } from "./types.js";

const requestSchema = z.object({
  machine: z.literal("SMEC + FANUC"),
  material: z.string().min(2),
  stock: z.string().min(3),
  quantity: z.coerce.number().int().min(1),
  advancedMode: z.coerce.boolean().default(false),
  operationOrder: z.string().optional(),
  rpmLimit: z.coerce.number().optional(),
  feedLimit: z.coerce.number().optional(),
  customDoc: z.coerce.number().optional()
});

const toolSchema = z.object({
  id: z.string().min(2),
  station: z.string().regex(/^T\d{4}$/),
  label: z.string().min(3),
  operationTypes: z.array(z.string()).min(1),
  minDiameter: z.coerce.number().min(0),
  maxDiameter: z.coerce.number().min(0),
  maxDoc: z.coerce.number().positive(),
  noseRadius: z.coerce.number().min(0),
  available: z.coerce.boolean().default(true)
});

const upload = multer({ storage: multer.memoryStorage() });

function detectKind(mimeType: string, filename: string): UploadKind {
  const lower = filename.toLowerCase();
  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".dxf")) {
    return "dxf";
  }
  if (lower.endsWith(".step") || lower.endsWith(".stp")) {
    return "step";
  }
  return "image";
}

function parseOperationOrder(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function createApp(jobStore: JobStore) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "smec-ai-cam-backend" });
  });

  app.get("/api/tools", (_req, res) => {
    res.json({ tools: listTools() });
  });

  app.post("/api/tools", (req, res) => {
    const parsed = toolSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid tool payload.",
        issues: parsed.error.issues
      });
    }
    const tool = addOrEnableTool(parsed.data);
    return res.status(201).json({ tool });
  });

  app.post("/api/auto-cnc/jobs", upload.array("files", 8), async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload.",
        issues: parsed.error.issues
      });
    }

    const files = (req.files ?? []) as Express.Multer.File[];
    if (files.length === 0) {
      return res.status(400).json({ error: "At least one drawing file is required." });
    }

    const uploads: UploadArtifact[] = files.map((file) => ({
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      kind: detectKind(file.mimetype, file.originalname),
      contentBase64: file.buffer.toString("base64")
    }));

    const payload = parsed.data;
    const job = createJob(
      {
        machine: payload.machine,
        material: payload.material,
        stock: payload.stock,
        quantity: payload.quantity,
        advancedMode: payload.advancedMode,
        manualOverrides: {
          operationOrder: parseOperationOrder(payload.operationOrder),
          rpmLimit: payload.rpmLimit,
          feedLimit: payload.feedLimit,
          customDoc: payload.customDoc
        }
      },
      uploads
    );
    await jobStore.set(job);

    // Fire-and-forget async pipeline.
    void runPipeline(job, async (updatedJob) => {
      await jobStore.set(updatedJob);
    });
    return res.status(201).json({
      jobId: job.id,
      status: job.status
    });
  });

  app.get("/api/auto-cnc/jobs/:id", async (req, res) => {
    const job = await jobStore.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found." });
    }
    return res.json(job);
  });

  app.get("/api/auto-cnc/jobs/:id/download", async (req, res) => {
    const job = await jobStore.get(req.params.id);
    if (!job || !job.finalProgram) {
      return res.status(404).json({ error: "Program is not ready." });
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${job.id}.nc"`);
    return res.send(job.finalProgram.gcode);
  });

  app.post("/api/auto-cnc/jobs/:id/retry", async (req, res) => {
    const job = await jobStore.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found." });
    }
    if (job.status === "running") {
      return res.status(409).json({ error: "Job is already running." });
    }

    resetJobForRetry(job);
    await jobStore.set(job);
    void runPipeline(job, async (updatedJob) => {
      await jobStore.set(updatedJob);
    });
    return res.status(202).json({ jobId: job.id, status: job.status });
  });

  app.post("/api/auto-cnc/jobs/:id/operator-approval", async (req, res) => {
    const job = await jobStore.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found." });
    }
    if (!job.finalProgram) {
      return res.status(409).json({ error: "Program is not ready for approval." });
    }

    const approve = Boolean(req.body?.approve);
    job.finalProgram.operatorApproved = approve;
    job.updatedAt = new Date().toISOString();
    await jobStore.set(job);
    return res.status(200).json({
      jobId: job.id,
      operatorApproved: job.finalProgram.operatorApproved
    });
  });

  return app;
}
