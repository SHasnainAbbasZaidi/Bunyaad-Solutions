import sanitizeHtml from "sanitize-html";
export function safeUrl(value: string, local = true) {
  if (!value) return true;
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return false;
  if (local && /^\/(?!\/)/.test(value)) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}
export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "code", "pre"],
    allowedAttributes: { a: ["href", "title"] }, allowedSchemes: ["https", "http", "mailto"], allowProtocolRelative: false,
  });
}
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.AUTH_URL || process.env.NEXTAUTH_URL || request.url).origin;
  if (origin !== expected) throw new HttpError(403, "Request origin is not allowed.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "JSON is required.");
  const text = await request.text();
  if (Buffer.byteLength(text) > 256000) throw new HttpError(413, "Request is too large.");
  try { return JSON.parse(text); } catch { throw new HttpError(400, "Invalid JSON."); }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") return Response.json({ error: "That slug, key or email already exists." }, { status: 409 });
  console.error("Operation failed", error instanceof Error ? error.message : "Unknown error");
  return Response.json({ error: "Unable to complete the request." }, { status: 500 });
}