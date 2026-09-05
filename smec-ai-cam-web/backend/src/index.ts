import { createApp } from "./app.js";
import { createJobStoreFromEnv } from "./store.js";

async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const jobStore = await createJobStoreFromEnv();
  const app = createApp(jobStore);

  const server = app.listen(port, () => {
    console.log(`SMEC AI CAM backend listening on :${port}`);
  });

  const shutdown = async () => {
    server.close();
    await jobStore.close();
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

void start();
