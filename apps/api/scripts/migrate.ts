import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 10 });
  const migrationsDir = path.resolve(__dirname, "../../../infra/postgres/init");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    const allFiles = await readdir(migrationsDir);
    const migrationFiles = allFiles
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const filename of migrationFiles) {
      const existing = await sql`
        SELECT 1
        FROM schema_migrations
        WHERE filename = ${filename}
        LIMIT 1
      `;
      if (existing.length > 0) {
        console.log(`Skipping ${filename} (already applied)`);
        continue;
      }

      const filePath = path.join(migrationsDir, filename);
      const migrationSql = await readFile(filePath, "utf8");

      await sql.unsafe(migrationSql);
      await sql`
        INSERT INTO schema_migrations (filename)
        VALUES (${filename})
      `;
      console.log(`Applied migration: ${filename}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
