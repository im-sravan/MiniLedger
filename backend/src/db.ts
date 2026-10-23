
import "dotenv/config";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function initializeDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("PostgreSQL schema initialized.");
}

if (require.main === module) {
  initializeDatabase()
    .then(() => pool.end())
    .catch(async (error: unknown) => {
      console.error("Database initialization failed:", error);
      await pool.end();
      process.exitCode = 1;
    });
}
