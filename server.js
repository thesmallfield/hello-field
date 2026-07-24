// hello-field: the smallest app that proves a Small Field deploy end to end.
// It serves one page and counts visits in Postgres, so a working page proves
// the URL, the build, and the database all came up.
import { createServer } from "node:http";
import pg from "pg";

const port = Number(process.env.PORT ?? 8080);
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl, max: 3 }) : null;

async function countVisit() {
  if (!pool) {
    return null;
  }
  await pool.query(
    "CREATE TABLE IF NOT EXISTS visits (id serial PRIMARY KEY, at timestamptz DEFAULT now())",
  );
  await pool.query("INSERT INTO visits DEFAULT VALUES");
  const result = await pool.query("SELECT count(*) AS total FROM visits");
  return Number(result.rows[0].total);
}

const server = createServer(async (request, response) => {
  try {
    const visits = await countVisit();
    const databaseLine =
      visits === null
        ? "No database connected."
        : `You are visitor number ${visits} — counted in Postgres.`;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      `<!doctype html><title>hello-field</title>` +
        `<h1>Hello from Small Field</h1><p>${databaseLine}</p>`,
    );
  } catch (error) {
    console.error("request failed:", error);
    response.writeHead(500, { "content-type": "text/plain" });
    response.end("Something went wrong.");
  }
});

server.listen(port, () => {
  console.log(`hello-field listening on port ${port}`);
});
