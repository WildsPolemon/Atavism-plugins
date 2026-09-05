import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import type { AutoCncJob } from "./types.js";

export interface JobStore {
  set(job: AutoCncJob): Promise<void>;
  get(id: string): Promise<AutoCncJob | undefined>;
  close(): Promise<void>;
}

export class MemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, AutoCncJob>();

  async set(job: AutoCncJob): Promise<void> {
    this.jobs.set(job.id, structuredClone(job));
  }

  async get(id: string): Promise<AutoCncJob | undefined> {
    const value = this.jobs.get(id);
    return value ? structuredClone(value) : undefined;
  }

  async close(): Promise<void> {
    // no-op
  }
}

export class MysqlJobStore implements JobStore {
  constructor(private readonly pool: Pool) {}

  async set(job: AutoCncJob): Promise<void> {
    const sql = `
      INSERT INTO auto_cnc_jobs (id, status, progress_percent, payload_json, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percent = VALUES(progress_percent),
        payload_json = VALUES(payload_json),
        updated_at = VALUES(updated_at)
    `;
    await this.pool.execute(sql, [
      job.id,
      job.status,
      job.progressPercent,
      JSON.stringify(job),
      job.updatedAt,
      job.createdAt
    ]);
  }

  async get(id: string): Promise<AutoCncJob | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT payload_json FROM auto_cnc_jobs WHERE id = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0) {
      return undefined;
    }
    const payload = rows[0].payload_json as string | object;
    return typeof payload === "string"
      ? (JSON.parse(payload) as AutoCncJob)
      : (payload as AutoCncJob);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function createJobStoreFromEnv(): Promise<JobStore> {
  const mysqlUrl = process.env.MYSQL_URL;
  const forceMysql = process.env.JOB_STORE_DRIVER === "mysql";

  if (!mysqlUrl && !forceMysql) {
    return new MemoryJobStore();
  }
  if (!mysqlUrl) {
    throw new Error("JOB_STORE_DRIVER=mysql requires MYSQL_URL.");
  }

  const pool = createPool({
    uri: mysqlUrl,
    connectionLimit: 10
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS auto_cnc_jobs (
      id VARCHAR(64) PRIMARY KEY,
      status VARCHAR(64) NOT NULL,
      progress_percent INT NOT NULL,
      payload_json JSON NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_status_updated (status, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  return new MysqlJobStore(pool);
}
