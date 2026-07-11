import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required.");
}

const databaseName = new URL(connectionString).pathname.replace(/^\//, "");

if (!/test/i.test(databaseName)) {
  throw new Error("Refusing to run: the database name must contain 'test'.");
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  const existing = await client.query(
    "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'",
  );

  if (existing.rows[0].count !== 0) {
    throw new Error("Refusing to run: the test database public schema is not empty.");
  }

  await client.query("BEGIN");

  for (const file of [
    "prisma/migrations/20260710_memory_foundation/migration.sql",
    "prisma/migrations/20260711_v2_access_foundation/migration.sql",
  ]) {
    await client.query(await readFile(file, "utf8"));
  }

  await client.query(
    `INSERT INTO users (id, email, name, "createdAt", "updatedAt")
     VALUES ('integration-user', 'integration@example.invalid', 'Integration Test', NOW(), NOW())`,
  );
  const result = await client.query(
    "SELECT name FROM users WHERE id = 'integration-user'",
  );

  if (result.rows[0]?.name !== "Integration Test") {
    throw new Error("Database write/read verification failed.");
  }

  console.log("Database migrations and CRUD integration test passed.");
} finally {
  await client.query("ROLLBACK").catch(() => undefined);
  await client.end();
}
