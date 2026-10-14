"use client";
import { useState } from "react";
import Link from "@/components/SiteLink";
export default function ResetPage() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <main className="admin-shell mx-auto max-w-lg p-8">
      <h1>Set your password</h1>
      <p>Access links expire after 30 minutes and can be used once.</p>
      {done ? (
        <Link href="/admin/login">Continue to sign in</Link>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const form = new FormData(e.currentTarget);
              const response = await fetch("/api/account/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: location.hash.slice(1),
                  password: form.get("password"),
                }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              history.replaceState(null, "", "/admin/reset");
              setDone(true);
              setMessage(
                "Password updated. Existing sessions have been revoked.",
              );
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Unable to reset.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </label>
          <button disabled={busy}>Save password</button>
        </form>
      )}
      <p role="status">{message}</p>
    </main>
  );
}
