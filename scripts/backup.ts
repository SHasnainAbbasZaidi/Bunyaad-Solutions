import { createRequire } from "node:module";
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");
import { mkdirSync } from "node:fs";
import path from "node:path";
const url = process.env.DATABASE_URL;
if (!url?.startsWith("file:"))
  throw new Error("This project uses SQLite. Set DATABASE_URL.");
const source = path.resolve("prisma", url.slice(5));
mkdirSync(".local-backups", { recursive: true });
const destination = path.resolve(
  ".local-backups",
  "database-" + new Date().toISOString().replace(/[:.]/g, "-") + ".db",
);
const db = new DatabaseSync(source);
db.exec("VACUUM INTO '" + destination.replaceAll("'", "''") + "'");
db.close();
console.log("Consistent SQLite backup saved:", destination);
