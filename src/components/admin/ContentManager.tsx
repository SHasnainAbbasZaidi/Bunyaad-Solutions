"use client";
import { clientRequest } from "@/lib/client-request";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { modules, initialValues, projectStatuses } from "@/lib/cms-config";
import { SettingsValue } from "./SettingsValue";
import { ReferencePicker } from "./ReferencePicker";
import { RichEditor } from "./RichEditor";
import { MediaLibrary } from "./MediaLibrary";
type RecordData = Record<string, unknown>;
type Revision = {
  id: string;
  entityType: string;
  content: string;
  createdAt: string;
  user: { name: string };
};
function toForm(resource: string, row: RecordData) {
  const output = { ...initialValues(resource) };
  for (const field of modules[resource].fields) {
    let value = row[field.key];
    if (field.key === "gallery" && Array.isArray(row.images))
      value = JSON.stringify(
        (row.images as { url: string }[]).map((i) => i.url),
      );
    if (field.type === "date" && value) {
      const d = new Date(String(value));
      value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    if (field.type === "list" && value) {
      try {
        value = JSON.parse(String(value)).join("\n");
      } catch {}
    }
    if (value !== null && value !== undefined) output[field.key] = value;
  }
  return output;
}
export function ContentManager({
  resource,
  superAdmin,
}: {
  resource: string;
  superAdmin: boolean;
}) {
  const config = modules[resource];
  const router = useRouter();
  const [rows, setRows] = useState<RecordData[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const [record, setRecord] = useState<RecordData | null>(null),
    [values, setValues] = useState<RecordData>({}),
    [revisions, setRevisions] = useState<Revision[]>([]),
    [editorKey, setEditorKey] = useState(0);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [mediaField, setMediaField] = useState<string | null>(null),
    [preview, setPreview] = useState(false),
    [resetUrl, setResetUrl] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const response = await clientRequest(
          "/api/admin/" +
            resource +
            "?q=" +
            encodeURIComponent(q) +
            "&page=" +
            page +
            "&status=" +
            encodeURIComponent(status),
          { signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setRows(data.rows);
        setTotal(data.total);
      } catch (error) {
        if (signal?.aborted) return;
        setMessage(
          error instanceof Error ? error.message : "Unable to load content.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [resource, q, page, status],
  );
  // Fetch updates state only after the network response resolves.
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function edit(row: RecordData) {
    setBusy(true);
    try {
      const response = await clientRequest(
        "/api/admin/" + resource + "/" + row.id,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRecord(data);
      const draft = data.revisions?.find((r: Revision) =>
        r.entityType.startsWith("draft:"),
      );
      setValues(toForm(resource, draft ? JSON.parse(draft.content) : data));
      setRevisions(data.revisions || []);
      setEditorKey((k) => k + 1);
      setPreview(false);
      setResetUrl("");
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to open record.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(draft: boolean) {
    if (!record) return;
    setBusy(true);
    setMessage("");
    try {
      const input = { ...values };
      for (const field of config.fields) {
        if (field.type === "date" && input[field.key])
          input[field.key] = new Date(String(input[field.key])).toISOString();
      }
      const response = await clientRequest(
        "/api/admin/" + resource + (record.id ? "/" + record.id : ""),
        {
          method: record.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: input,
            draft,
            version: record._version,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load();
      await edit(data);
      if (!draft) router.refresh();
      setMessage(
        draft
          ? "Draft saved. Public content is unchanged."
          : "Saved. Publication follows the visibility and status fields.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="eyebrow">Website content</p>
          <h1>{config.label}</h1>
        </div>
        {resource !== "inquiries" && (
          <button
            disabled={busy}
            onClick={() => {
              setRecord({});
              setValues(initialValues(resource));
              setRevisions([]);
              setEditorKey((k) => k + 1);
              setResetUrl("");
              setPreview(false);
            }}
          >
            New {resource === "users" ? "administrator" : "entry"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-4 my-6">
        <label>
          Search
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {["projects", "news", "inquiries"].includes(resource) && (
          <label>
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {(resource === "projects"
                ? projectStatuses
                : resource === "news"
                  ? ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]
                  : ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <span className="self-end">
          {loading ? "Loading content…" : `${total} records`}
        </span>
      </div>
      <p role="status" className="feedback">
        {message || (busy ? "Working…" : loading ? "Loading content…" : "")}
      </p>
      {record && (
        <div className="panel editor-panel">
          <div className="flex justify-between gap-4">
            <h2>{record.id ? "Edit entry" : "New entry"}</h2>
            <button
              type="button"
              onClick={() => {
                setRecord(null);
                setResetUrl("");
              }}
            >
              Close editor
            </button>
          </div>
          {resource === "inquiries" && (
            <div className="panel">
              <h3>{String(record.subject)}</h3>
              <p>
                {String(record.fullName)} · {String(record.email)}
              </p>
              <p>
                {String(record.company || "")} · {String(record.inquiryType)}
              </p>
              <p className="whitespace-pre-wrap">{String(record.message)}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(false);
            }}
          >
            <div className="grid md:grid-cols-2 gap-5 my-5">
              {config.fields.map((field) => (
                <div
                  key={field.key}
                  className={
                    ["rich", "textarea", "list"].includes(field.type)
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  {resource === "settings" && field.key === "value" ? (
                    <SettingsValue
                      setting={String(values.key)}
                      value={String(values.value || "")}
                      onChange={(v) => setValues({ ...values, value: v })}
                    />
                  ) : [
                      "authorId",
                      "assignedToId",
                      "relatedProjectIds",
                    ].includes(field.key) ? (
                    <ReferencePicker
                      label={
                        field.key === "relatedProjectIds"
                          ? "Related projects"
                          : field.key === "authorId"
                            ? "Author"
                            : "Assigned administrator"
                      }
                      kind={
                        field.key === "relatedProjectIds" ? "projects" : "users"
                      }
                      multiple={field.key === "relatedProjectIds"}
                      value={String(values[field.key] || "")}
                      onChange={(v) => setValues({ ...values, [field.key]: v })}
                    />
                  ) : field.type === "rich" ? (
                    <>
                      <span className="block font-medium mb-2">
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      <RichEditor
                        key={editorKey + field.key}
                        value={String(values[field.key] || "")}
                        onChange={(v) =>
                          setValues((old) => ({ ...old, [field.key]: v }))
                        }
                        label={field.label}
                      />
                    </>
                  ) : (
                    <label>
                      {field.label}
                      {field.required ? " *" : ""}
                      {field.type === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={!!values[field.key]}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [field.key]: e.target.checked,
                            })
                          }
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={String(values[field.key] || "")}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [field.key]: e.target.value,
                            })
                          }
                        >
                          {field.options?.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : ["textarea", "list"].includes(field.type) ? (
                        <textarea
                          rows={field.type === "list" ? 3 : 5}
                          required={field.required}
                          value={String(values[field.key] || "")}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "date"
                                ? "datetime-local"
                                : field.type === "email"
                                  ? "email"
                                  : "text"
                          }
                          required={field.required}
                          min={field.type === "number" ? 0 : undefined}
                          value={String(values[field.key] ?? "")}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [field.key]:
                                field.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                        />
                      )}
                    </label>
                  )}
                  {field.type === "list" && <small>One item per line.</small>}
                  {(field.type === "image" || field.key === "gallery") && (
                    <button
                      type="button"
                      onClick={() => setMediaField(field.key)}
                    >
                      Choose from media
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button disabled={busy}>Save changes</button>
              {config.drafts && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => save(true)}
                >
                  Save draft
                </button>
              )}
              {config.drafts && (
                <button type="button" onClick={() => setPreview(!preview)}>
                  Preview content
                </button>
              )}
              {superAdmin && !!record.id && resource !== "users" && (
                <button
                  type="button"
                  disabled={busy}
                  className="danger"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Delete this entry? This removes it from the website.",
                      )
                    )
                      return;
                    setBusy(true);
                    try {
                      const response = await clientRequest(
                        "/api/admin/" + resource + "/" + record.id,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ version: record._version }),
                        },
                      );
                      const body = await response.json();
                      if (!response.ok) throw new Error(body.error);
                      setRecord(null);
                      await load();
                      setMessage("Entry deleted.");
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Delete failed.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Delete entry
                </button>
              )}
              {resource === "users" && !!record.id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await clientRequest(
                        "/api/admin/users/" + record.id + "/reset",
                        { method: "POST" },
                      );
                      const body = await response.json();
                      if (!response.ok) throw new Error(body.error);
                      setResetUrl(body.url);
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to reset access.",
                      );
                    }
                  }}
                >
                  Create access / reset link
                </button>
              )}
            </div>
          </form>
          {resetUrl && (
            <div className="panel">
              <p>
                Share this one-time link privately with the account owner. It
                expires in 30 minutes.
              </p>
              <input
                aria-label="One-time access link"
                readOnly
                value={resetUrl}
              />
            </div>
          )}
          {preview && (
            <div className="panel">
              <h2>Content preview</h2>
              {config.fields
                .filter((f) =>
                  ["rich", "textarea", "text", "image"].includes(f.type),
                )
                .map((f) => (
                  <div key={f.key}>
                    <strong>{f.label}</strong>
                    {f.type === "rich" ? (
                      <iframe
                        title={f.label + " preview"}
                        sandbox=""
                        srcDoc={
                          '<meta charset="utf-8"><style>body{font:16px system-ui;line-height:1.7}</style>' +
                          String(values[f.key] || "")
                        }
                        className="w-full h-64 bg-white"
                      />
                    ) : f.type === "image" && values[f.key] ? (
                      <img
                        className="max-h-64"
                        src={String(values[f.key])}
                        alt="Selected preview"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {String(values[f.key] || "")}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
          {!!revisions.length && (
            <details className="mt-6">
              <summary>Drafts & revision history ({revisions.length})</summary>
              {revisions.map((revision) => (
                <div key={revision.id} className="flex flex-wrap gap-3 py-2">
                  <span>
                    {revision.entityType.startsWith("draft:")
                      ? "Saved draft"
                      : "Previous version"}{" "}
                    · {new Date(revision.createdAt).toLocaleString()} ·{" "}
                    {revision.user.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setValues(toForm(resource, JSON.parse(revision.content)));
                      setEditorKey((k) => k + 1);
                      setMessage(
                        "Revision loaded into editor. Save changes to apply it.",
                      );
                    }}
                  >
                    Restore to editor
                  </button>
                </div>
              ))}
            </details>
          )}
        </div>
      )}
      {mediaField && (
        <div className="panel my-6">
          <button type="button" onClick={() => setMediaField(null)}>
            Close media selector
          </button>
          <MediaLibrary
            onSelect={(url) => {
              setValues((old) => ({
                ...old,
                [mediaField]:
                  mediaField === "gallery"
                    ? String(old.gallery || "") +
                      (old.gallery ? "\n" : "") +
                      url
                    : url,
              }));
              setMediaField(null);
            }}
          />
        </div>
      )}
      <div className="overflow-x-auto" aria-busy={loading}>
        <table>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>
                  <strong>
                    {String(
                      row.title ||
                        row.name ||
                        row.headline ||
                        row.subject ||
                        row.key,
                    )}
                  </strong>
                  <small className="block break-all">
                    {String(row.slug || row.email || row.id)}
                  </small>
                </td>
                <td>
                  {String(
                    row.status ??
                      (row.published === false ||
                      row.visible === false ||
                      row.active === false
                        ? "Hidden / disabled"
                        : "Active"),
                  )}
                </td>
                <td>
                  {row.updatedAt
                    ? new Date(String(row.updatedAt)).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <button disabled={busy} onClick={() => edit(row)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && !rows.length && (
        <div className="panel">No entries found.</div>
      )}
      <div className="flex gap-4 my-5">
        <button
          disabled={loading || page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={loading || page * 20 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
