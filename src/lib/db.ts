import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diset di environment variables.");
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });
}

// Lazily create the pool on first real use (not at module load time),
// so `next build` doesn't require a live DATABASE_URL to compile.
function getPool() {
  if (!global._pgPool) {
    global._pgPool = createPool();
  }
  return global._pgPool;
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]) {
  const result = await getPool().query<T>(text, params);
  return result;
}
