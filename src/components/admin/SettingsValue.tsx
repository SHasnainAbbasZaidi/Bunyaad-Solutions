"use client";
import { useState } from "react";
import { MediaLibrary } from "./MediaLibrary";
import { defaultSectionCopy } from "@/lib/branding";
const sections = [
  "hero",
  "about",
  "services",
  "projects",
  "approach",
  "team",
  "news",
  "contact",
];
const copyKeys = Object.keys(defaultSectionCopy);
export function SettingsValue({
  setting,
  value,
  onChange,
}: {
  setting: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showMedia, setShowMedia] = useState(false);
  if (["logo_light", "logo_dark", "icon_light", "icon_dark"].includes(setting))
    return (
      <div>
        {value && (
          <img
            src={value}
            alt="Selected brand asset"
            className="max-h-24 max-w-64 object-contain mb-3"
          />
        )}
        <button type="button" onClick={() => setShowMedia(!showMedia)}>
          Choose brand image
        </button>
        {showMedia && (
          <MediaLibrary
            onSelect={(url) => {
              onChange(url);
              setShowMedia(false);
            }}
          />
        )}
      </div>
    );
  if (setting === "hero_highlights") {
    let items: { title: string; description: string }[] = [];
    try {
      const parsed = JSON.parse(value || "[]");
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
    return (
      <fieldset>
        <legend>Hero highlight cards (display order)</legend>
        {items.map((item, i) => (
          <div className="panel mt-3" key={i}>
            {(["title", "description"] as const).map((field) => (
              <label key={field}>
                {field}
                <input
                  value={item[field]}
                  onChange={(e) =>
                    onChange(
                      JSON.stringify(
                        items.map((v, j) =>
                          j === i ? { ...v, [field]: e.target.value } : v,
                        ),
                      ),
                    )
                  }
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange(JSON.stringify(items.filter((_, j) => j !== i)))
              }
            >
              Remove card
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={items.length >= 4}
          onClick={() =>
            onChange(JSON.stringify([...items, { title: "", description: "" }]))
          }
        >
          Add card
        </button>
      </fieldset>
    );
  }
  if (setting === "theme_default")
    return (
      <label>
        Default theme
        <select
          value={value || "dark"}
          onChange={(e) => onChange(e.target.value)}
        >
          {["dark", "light", "system"].map((theme) => (
            <option key={theme}>{theme}</option>
          ))}
        </select>
      </label>
    );
  if (setting === "homepage_sections") {
    let data: Record<string, boolean> = {};
    try {
      data = JSON.parse(value || "{}");
    } catch {}
    return (
      <fieldset>
        <legend>Homepage sections</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {sections.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={data[key] !== false}
                onChange={(e) =>
                  onChange(JSON.stringify({ ...data, [key]: e.target.checked }))
                }
              />
              {key}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (setting === "navigation" || setting === "footer_navigation") {
    let data: { name: string; href: string }[] = [];
    try {
      data = JSON.parse(value || "[]");
    } catch {}
    return (
      <fieldset>
        <legend>Navigation links (display order)</legend>
        {data.map((link, i) => (
          <div key={i} className="grid sm:grid-cols-3 gap-3 my-3">
            <label>
              Label
              <input
                value={link.name}
                onChange={(e) =>
                  onChange(
                    JSON.stringify(
                      data.map((v, j) =>
                        i === j ? { ...v, name: e.target.value } : v,
                      ),
                    ),
                  )
                }
              />
            </label>
            <label>
              Link
              <input
                value={link.href}
                onChange={(e) =>
                  onChange(
                    JSON.stringify(
                      data.map((v, j) =>
                        i === j ? { ...v, href: e.target.value } : v,
                      ),
                    ),
                  )
                }
              />
            </label>
            <div className="flex gap-2 items-end">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => {
                  const rows = [...data];
                  [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]];
                  onChange(JSON.stringify(rows));
                }}
              >
                Up
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(JSON.stringify(data.filter((_, j) => j !== i)))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={data.length >= 10}
          onClick={() =>
            onChange(JSON.stringify([...data, { name: "", href: "/" }]))
          }
        >
          Add link
        </button>
      </fieldset>
    );
  }
  if (setting === "section_copy") {
    let data: Record<string, string> = {};
    try {
      data = JSON.parse(value || "{}");
    } catch {}
    return (
      <fieldset>
        <legend>Public section headings, descriptions & empty states</legend>
        <div className="grid gap-4 mt-4">
          {copyKeys.map((key) => (
            <label key={key}>
              {key.replaceAll("_", " ")}
              <textarea
                rows={2}
                value={data[key] || ""}
                onChange={(e) =>
                  onChange(JSON.stringify({ ...data, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <label>
      Value
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
