const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const failures = [];
if (!process.env.DATABASE_URL?.startsWith("file:"))
  failures.push("DATABASE_URL must reference a persistent SQLite file.");
if (
  !secret ||
  secret.length < 32 ||
  /change-this|your-secret|replace-me/i.test(secret)
)
  failures.push(
    "Set AUTH_SECRET to a unique random value of at least 32 characters.",
  );
for (const key of ["NEXT_PUBLIC_SITE_URL"]) {
  try {
    const url = new URL(process.env[key] || "");
    if (!["http:", "https:"].includes(url.protocol)) throw Error();
  } catch {
    failures.push(key + " must be a valid http(s) URL.");
  }
}
try {
  const url = new URL(process.env.AUTH_URL || process.env.NEXTAUTH_URL || "");
  if (!["http:", "https:"].includes(url.protocol)) throw Error();
} catch {
  failures.push("Set AUTH_URL to the public application origin.");
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("Environment configuration checks passed.");
