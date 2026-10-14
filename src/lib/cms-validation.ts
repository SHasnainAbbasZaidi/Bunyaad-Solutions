import { z } from "zod";
import slugify from "slugify";
import { modules, settingKeys } from "./cms-config";
import { cleanHtml, safeUrl, HttpError } from "./security";
export function validateContent(resource: string, input: unknown) {
  const config = modules[resource];
  if (!config) throw new HttpError(404, "Unknown module.");
  const shape: Record<string, z.ZodType> = {};
  for (const field of config.fields) {
    if (field.type === "boolean") shape[field.key] = z.boolean().default(false);
    else if (field.type === "number")
      shape[field.key] = z.number().int().min(0).max(100000).default(0);
    else if (field.type === "select")
      shape[field.key] = z.preprocess(
        (v) => v ?? "",
        z
          .string()
          .refine(
            (v) => (!field.required && !v) || field.options!.includes(v),
            "Choose a valid option",
          ),
      );
    else {
      let schema = z
        .string()
        .trim()
        .max(
          field.type === "rich"
            ? 100000
            : field.type === "textarea"
              ? 10000
              : field.type === "list"
                ? 10000
                : 500,
        );
      if (field.required) schema = schema.min(1, "Required");
      shape[field.key] = field.required
        ? schema
        : z.preprocess((v) => v ?? "", schema);
    }
  }
  const parsed = z.object(shape).safeParse(input);
  if (!parsed.success)
    throw new HttpError(
      400,
      parsed.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; "),
    );
  const data = parsed.data as Record<string, unknown>;
  for (const field of config.fields) {
    const value = data[field.key];
    if (typeof value !== "string") continue;
    if ((field.type === "url" || field.type === "image") && !safeUrl(value))
      throw new HttpError(
        400,
        field.label + ": use a local path or http(s) URL.",
      );
    if (
      field.type === "image" &&
      value &&
      !/^\/(?:brand|uploads)\/[^?#]+$/.test(value)
    )
      throw new HttpError(400, "Select an image from the media library.");
    if (field.type === "email" && !z.email().safeParse(value).success)
      throw new HttpError(400, "Invalid email.");
    if (field.type === "email") data[field.key] = value.toLowerCase();
    if (field.type === "rich") data[field.key] = cleanHtml(value);
    if (field.type === "date") {
      if (value && !Number.isFinite(Date.parse(value)))
        throw new HttpError(400, "Invalid date.");
      data[field.key] = value ? new Date(value) : null;
    }
    if (field.type === "list") {
      let values: unknown;
      try {
        values = value.startsWith("[")
          ? JSON.parse(value)
          : value
              .split(/\r?\n/)
              .map((v) => v.trim())
              .filter(Boolean);
      } catch {
        throw new HttpError(400, field.label + ": invalid list.");
      }
      if (
        !Array.isArray(values) ||
        values.length > 100 ||
        values.some((v) => typeof v !== "string" || v.length > 500)
      )
        throw new HttpError(400, "Invalid list.");
      if (
        field.key === "gallery" &&
        values.some(
          (v) => !/^\/(?:brand|uploads)\/[^?#]+$/.test(v) || !safeUrl(v),
        )
      )
        throw new HttpError(400, "Gallery must use media library images.");
      data[field.key] = JSON.stringify(values);
    }
  }
  if ("slug" in data) {
    data.slug = slugify(String(data.slug || data.title || data.name), {
      lower: true,
      strict: true,
    });
    if (!data.slug) throw new HttpError(400, "A valid slug is required.");
  }
  if (
    resource === "about" &&
    !/^[a-z][a-z0-9_]{0,60}$/.test(String(data.sectionKey))
  )
    throw new HttpError(400, "Use a lowercase section key.");
  if (resource === "news") {
    if (
      data.status === "SCHEDULED" &&
      (!data.scheduledAt || (data.scheduledAt as Date) <= new Date())
    )
      throw new HttpError(400, "Choose a future publication date.");
    if (data.status === "PUBLISHED") {
      if (data.publishedAt && (data.publishedAt as Date) > new Date())
        throw new HttpError(400, "Use Scheduled for future articles.");
      data.publishedAt ||= new Date();
      data.scheduledAt = null;
    }
    if (data.status !== "SCHEDULED") data.scheduledAt = null;
  }
  if (resource === "settings") {
    if (!settingKeys.includes(String(data.key)))
      throw new HttpError(400, "Unknown setting.");
    const value = String(data.value);
    if (
      String(data.key).endsWith("_url") &&
      !safeUrl(value, data.key === "header_cta_url")
    )
      throw new HttpError(400, "Invalid social URL.");
    if (
      ["logo_light", "logo_dark", "icon_light", "icon_dark"].includes(
        String(data.key),
      ) &&
      (!/^\/(?:brand|uploads)\/[^?#]+$/.test(value) || !safeUrl(value))
    )
      throw new HttpError(400, "Choose a brand image from the media library.");
    if (
      data.key === "contact_email" &&
      value &&
      !z.email().safeParse(value).success
    )
      throw new HttpError(400, "Invalid contact email.");
    if (
      data.key === "theme_default" &&
      !["light", "dark", "system"].includes(value)
    )
      throw new HttpError(400, "Choose light, dark or system.");
    if (
      [
        "navigation",
        "footer_navigation",
        "hero_highlights",
        "homepage_sections",
        "section_copy",
      ].includes(String(data.key))
    ) {
      let object: unknown;
      try {
        object = JSON.parse(value);
      } catch {
        throw new HttpError(400, "This setting requires valid JSON.");
      }
      if (
        ["navigation", "footer_navigation"].includes(String(data.key)) &&
        (!Array.isArray(object) ||
          object.length > 10 ||
          object.some(
            (v) =>
              !v ||
              typeof v.name !== "string" ||
              v.name.length > 40 ||
              typeof v.href !== "string" ||
              !v.href ||
              !safeUrl(v.href),
          ))
      )
        throw new HttpError(
          400,
          "Navigation requires up to 10 {name, href} entries.",
        );
      if (
        data.key === "hero_highlights" &&
        (!Array.isArray(object) ||
          object.length > 4 ||
          object.some(
            (v) =>
              !v ||
              typeof v.title !== "string" ||
              !v.title.trim() ||
              v.title.length > 80 ||
              typeof v.description !== "string" ||
              v.description.length > 300,
          ))
      )
        throw new HttpError(
          400,
          "Use up to four highlight cards with a title and description.",
        );
      if (
        data.key === "homepage_sections" &&
        (!object ||
          Array.isArray(object) ||
          typeof object !== "object" ||
          Object.values(object).some((v) => typeof v !== "boolean"))
      )
        throw new HttpError(
          400,
          "Section visibility requires an object of booleans.",
        );
      if (
        data.key === "section_copy" &&
        (!object ||
          Array.isArray(object) ||
          typeof object !== "object" ||
          Object.values(object).some((v) => typeof v !== "string"))
      )
        throw new HttpError(
          400,
          "Section copy requires an object of text values.",
        );
    }
  }
  return data;
}
