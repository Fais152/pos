import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur");
}

const globalForDb = globalThis as unknown as {
  __posSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__posSql ??
  postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 10,
    idle_timeout: 300,
    connect_timeout: 10,
    keep_alive: 60,
    connection: { statement_timeout: 30000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__posSql = sql;
}

export const db = drizzle(sql, { schema });
export { sql };
export * from "./schema";
