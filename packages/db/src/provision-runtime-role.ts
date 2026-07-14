import { createDatabasePool } from "./pool.js";

const runtimeRole = "app_runtime";
const runtimePassword = process.env["RUNTIME_DATABASE_PASSWORD"];

if (!runtimePassword || !/^[a-f0-9]{64}$/.test(runtimePassword)) {
  throw new Error("RUNTIME_DATABASE_PASSWORD must be a 64-character lowercase hexadecimal value.");
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const pool = createDatabasePool({ max: 1 });

try {
  await pool.query("BEGIN");

  const databaseResult = await pool.query<{ databaseName: string }>(
    'SELECT current_database() AS "databaseName"',
  );
  const databaseName = databaseResult.rows[0]?.databaseName;

  if (!databaseName) {
    throw new Error("Unable to determine the current PostgreSQL database.");
  }

  const roleResult = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists",
    [runtimeRole],
  );
  const roleSql = quoteIdentifier(runtimeRole);
  const passwordSql = quoteLiteral(runtimePassword);

  if (roleResult.rows[0]?.exists) {
    await pool.query(`ALTER ROLE ${roleSql} WITH LOGIN PASSWORD ${passwordSql}`);
  } else {
    await pool.query(
      `CREATE ROLE ${roleSql} WITH LOGIN PASSWORD ${passwordSql} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT 20`,
    );
  }

  const databaseSql = quoteIdentifier(databaseName);

  await pool.query(`REVOKE CONNECT, TEMPORARY ON DATABASE ${databaseSql} FROM PUBLIC`);
  await pool.query(`GRANT CONNECT ON DATABASE ${databaseSql} TO ${roleSql}`);
  await pool.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  await pool.query(`GRANT USAGE ON SCHEMA public TO ${roleSql}`);
  await pool.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleSql}`,
  );
  await pool.query(
    `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${roleSql}`,
  );
  await pool.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleSql}`,
  );
  await pool.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${roleSql}`,
  );

  await pool.query("COMMIT");
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
} finally {
  await pool.end();
}
