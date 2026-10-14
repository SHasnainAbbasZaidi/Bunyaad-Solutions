"use client";
import { clientRequest } from "@/lib/client-request";
import { useCallback, useEffect, useState } from "react";
type Media = {
  id: string;
  url: string;
  originalName: string;
  alt: string;
  isProtected: boolean;
};
export function MediaLibrary({
  onSelect,
  canDelete = false,
}: {
  onSelect?: (url: string) => void;
  canDelete?: boolean;
}) {
  const [rows, setRows] = useState<Media[]>([]),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await clientRequest(
        "/api/admin/media?q=" + encodeURIComponent(q) + "&page=" + page,
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setRows(body.rows);
      setTotal(body.total);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load media.",
      );
    }
  }, [q, page]);
  // State changes happen after the fetch resolves, not synchronously in this effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return (
    <section>
      <h2>Media library</h2>
      <p>
        PNG, JPEG or WebP, up to 5 MB. Images are resized and converted to WebP.
      </p>
      <form
        className="panel flex flex-wrap gap-3 items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          try {
            const response = await clientRequest("/api/admin/media", {
              method: "POST",
              body: new FormData(form),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error);
            form.reset();
            await load();
            setMessage("Image uploaded.");
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Upload failed.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Image
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
          />
        </label>
        <label>
          Alternative text
          <input name="alt" maxLength={300} />
        </label>
        <button disabled={busy}>Upload image</button>
      </form>
      <label>
        Search images
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <p role="status">{message}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rows.map((media) => (
          <article className="panel" key={media.id}>
            <img
              src={media.url}
              alt={media.alt || media.originalName}
              className="h-32 w-full object-contain"
              loading="lazy"
            />
            <p className="break-all text-sm">{media.originalName}</p>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(media.url)}>
                Select image
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(media.url);
                    setMessage("Image URL copied.");
                  } catch {
                    setMessage(media.url);
                  }
                }}
              >
                Copy URL
              </button>
            )}
            {canDelete && !media.isProtected && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Delete this unused image?")) return;
                  try {
                    const response = await clientRequest("/api/admin/media", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: media.id }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    await load();
                    setMessage("Image deleted.");
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : "Delete failed.",
                    );
                  }
                }}
              >
                Delete
              </button>
            )}
          </article>
        ))}
      </div>
      {!rows.length && <p>No images found.</p>}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          disabled={page * 24 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
