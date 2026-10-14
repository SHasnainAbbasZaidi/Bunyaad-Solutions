import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CONCEPT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    PLANNING:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_DEVELOPMENT:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    TESTING:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    COMING_SOON:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    LIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    ON_HOLD:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    ARCHIVED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    // Article statuses
    DRAFT:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PUBLISHED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    // Inquiry statuses
    NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    REPLIED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    CLOSED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  };
  return (
    colors[status] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  );
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONCEPT: "Concept",
    PLANNING: "Planning",
    IN_DEVELOPMENT: "In Development",
    TESTING: "Testing",
    COMING_SOON: "Coming Soon",
    LIVE: "Live",
    ON_HOLD: "On Hold",
    ARCHIVED: "Archived",
    DRAFT: "Draft",
    PUBLISHED: "Published",
    NEW: "New",
    IN_PROGRESS: "In Progress",
    REPLIED: "Replied",
    CLOSED: "Closed",
    B2B: "B2B",
    B2C: "B2C",
    D2C: "D2C",
    HYBRID: "Hybrid",
  };
  return labels[status] || status;
}
