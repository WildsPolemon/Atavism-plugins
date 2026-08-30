import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MemoryJobStore } from "./store.js";

describe("AUTO CNC API", () => {
  it("creates job and eventually returns completed status", async () => {
    const app = createApp(new MemoryJobStore());
    const dxf = [
      "0",
      "SECTION",
      "2",
      "ENTITIES",
      "0",
      "TEXT",
      "1",
      "D50",
      "0",
      "TEXT",
      "1",
      "D40",
      "0",
      "TEXT",
      "1",
      "M30x1.5",
      "0",
      "TEXT",
      "1",
      "R2",
      "0",
      "TEXT",
      "1",
      "Ra 1.6 Groove",
      "0",
      "ENDSEC",
      "0",
      "EOF"
    ].join("\n");

    const createRes = await request(app)
      .post("/api/auto-cnc/jobs")
      .field("machine", "SMEC + FANUC")
      .field("material", "Steel 45")
      .field("stock", "Ø60 x 100 mm")
      .field("quantity", "10")
      .field("advancedMode", "false")
      .attach("files", Buffer.from(dxf), "drawing.dxf");

    expect(createRes.status).toBe(201);
    const jobId = createRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    let status = "queued";
    let attempts = 0;
    while (status !== "completed" && status !== "failed" && status !== "manual_review_required" && attempts < 80) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const poll = await request(app).get(`/api/auto-cnc/jobs/${jobId}`);
      status = poll.body.status;
      attempts += 1;
      if (status === "completed") {
        expect(poll.body.finalProgram.gcodeStatus).toBe("VALID");
        expect(poll.body.progressPercent).toBe(100);
      }
    }
    if (status !== "completed") {
      const finalState = await request(app).get(`/api/auto-cnc/jobs/${jobId}`);
      throw new Error(`Expected completed status, got ${status}. Errors: ${JSON.stringify(finalState.body.errors)}`);
    }
    expect(status).toBe("completed");
  }, 15000);
});
