import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("AUTO CNC API", () => {
  it("creates job and eventually returns completed status", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/api/auto-cnc/jobs")
      .field("machine", "SMEC + FANUC")
      .field("material", "Steel 45")
      .field("stock", "Ø60 x 100 mm")
      .field("quantity", "10")
      .field("advancedMode", "false")
      .attach("files", Buffer.from("fake image"), "drawing.jpg");

    expect(createRes.status).toBe(201);
    const jobId = createRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    let status = "queued";
    let attempts = 0;
    while (status !== "completed" && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const poll = await request(app).get(`/api/auto-cnc/jobs/${jobId}`);
      status = poll.body.status;
      attempts += 1;
      if (status === "completed") {
        expect(poll.body.finalProgram.gcodeStatus).toBe("VALID");
        expect(poll.body.progressPercent).toBe(100);
      }
    }
    expect(status).toBe("completed");
  });
});
