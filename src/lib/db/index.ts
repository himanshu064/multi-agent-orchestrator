import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof create>;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
  return drizzle(postgres(url, { prepare: false }), { schema });
}

// Kept on globalThis so dev hot reloads reuse one connection pool.
const g = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  return (g.__db ??= create());
}
