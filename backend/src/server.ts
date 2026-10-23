
import "dotenv/config";
import app from "./app";
import { pool, initializeDatabase } from "./db";

const port = Number(process.env.PORT || 4000);

async function start(): Promise<void> {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  await initializeDatabase();

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`MiniLedger API listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(async (error: unknown) => {
  console.error("Failed to start MiniLedger:", error);
  await pool.end();
  process.exitCode = 1;
});
