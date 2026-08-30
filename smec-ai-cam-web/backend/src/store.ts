import type { AutoCncJob } from "./types.js";

const jobs = new Map<string, AutoCncJob>();

export const jobStore = {
  set(job: AutoCncJob): void {
    jobs.set(job.id, job);
  },
  get(id: string): AutoCncJob | undefined {
    return jobs.get(id);
  }
};
