"use client";
import { useEffect, useState } from "react";
export function ReferencePicker({
  kind,
  label,
  value,
  multiple = false,
  onChange,
}: {
  kind: "users" | "projects";
  label: string;
  value: string;
  multiple?: boolean;
  onChange: (value: string) => void;
}) {
  const [rows, setRows] = useState<{ id: string; name: string }[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/references")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        if (active) setRows(body[kind]);
      })
      .catch(() => {
        if (active) setError("Unable to load choices. Reload the page.");
      });
    return () => {
      active = false;
    };
  }, [kind]);
  let selected: string[] = [];
  try {
    selected = value.startsWith("[")
      ? JSON.parse(value)
      : value.split("\n").filter(Boolean);
  } catch {}
  return (
    <label>
      {label}
      <select
        multiple={multiple}
        value={multiple ? selected : value}
        onChange={(e) =>
          onChange(
            multiple
              ? Array.from(e.target.selectedOptions, (o) => o.value).join("\n")
              : e.target.value,
          )
        }
      >
        {!multiple && <option value="">Select an administrator</option>}
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
      {multiple && (
        <small>Use Ctrl / Command to select multiple projects.</small>
      )}
      {error && <span role="alert">{error}</span>}
    </label>
  );
}
