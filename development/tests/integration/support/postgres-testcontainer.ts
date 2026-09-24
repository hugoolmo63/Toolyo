import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";

export interface StartedTestDatabase {
  container: StartedPostgreSqlContainer;
  connectionString: string;
}

/**
 * Starts the same PostgreSQL image used by CI and returns its dynamic URL.
 * Callers must create PrismaClient only after this promise resolves.
 */
export async function startTestDatabase(): Promise<StartedTestDatabase> {
  const container = await new PostgreSqlContainer(
    process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis",
  )
    .withDatabase("toolyo_test")
    .withUsername("toolyo")
    .withPassword("toolyo")
    .start();

  const connectionString = container.getConnectionUri();
  process.env.DATABASE_URL = connectionString;

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "pipe",
  });

  return { container, connectionString };
}

export async function stopTestDatabase(database: StartedTestDatabase | undefined) {
  await database?.container.stop();
}