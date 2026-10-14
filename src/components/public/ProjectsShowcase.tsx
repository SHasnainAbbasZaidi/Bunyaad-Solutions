"use client";

import * as React from "react";
import { projectStatuses } from "@/lib/cms-config";
import { useSiteSettings, sectionCopy } from "./SiteContext";
import Link from "@/components/SiteLink";
import { ExternalLink } from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry?: string | null;
  status: string;
  coverImage?: string | null;
  logo?: string | null;
  featured?: boolean;
  externalUrl?: string | null;
  technologies?: string | null;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  LIVE: {
    label: "Live & Operating",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  IN_DEVELOPMENT: {
    label: "In Development",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300 border-blue-500/30",
    dot: "bg-blue-500",
  },
  COMING_SOON: {
    label: "Coming Soon",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300 border-purple-500/30",
    dot: "bg-purple-500",
  },
  CONCEPT: {
    label: "Conceptual Phase",
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
  },
};

export function ProjectsShowcase({ projects }: { projects: ProjectItem[] }) {
  const settings = useSiteSettings();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [category, setCategory] = React.useState("");

  const filteredProjects = projects.filter((project) => {
    if (
      !project.name.toLowerCase().includes(query.toLowerCase()) ||
      (status && project.status !== status) ||
      (category && project.industry !== category)
    )
      return false;
    return true;
  });

  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
              {sectionCopy(settings, "projects_eyebrow", "Our work")}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {sectionCopy(settings, "projects_title", "Our Digital Platforms")}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl text-base sm:text-lg">
              {sectionCopy(
                settings,
                "projects_description",
                "Explore our planned and active digital platform initiatives.",
              )}
            </p>
          </div>
        </div>

        <div className="public-filters mb-8">
          <label>
            Search projects
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {[
                ...new Set(projects.map((p) => p.industry).filter(Boolean)),
              ].map((c) => (
                <option key={c} value={c!}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {projectStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!filteredProjects.length && (
          <p className="py-10">
            {projects.length
              ? "No projects match these filters."
              : sectionCopy(
                  settings,
                  "projects_empty",
                  "Updates will be shared here as our work progresses.",
                )}
          </p>
        )}
        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => {
            const statusInfo = statusConfig[project.status] || {
              ...statusConfig.CONCEPT,
              label: project.status.replaceAll("_", " "),
            };
            let techList: string[] = [];
            try {
              if (project.technologies) {
                const parsed = JSON.parse(project.technologies);
                techList = Array.isArray(parsed)
                  ? parsed.filter((t) => typeof t === "string")
                  : [];
              }
            } catch {
              techList = [];
            }

            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-7 shadow-xs hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div>
                  {project.coverImage && (
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      loading="lazy"
                      className="w-full h-44 object-cover rounded-xl mb-5"
                    />
                  )}
                  {project.logo && (
                    <img
                      src={project.logo}
                      alt={project.name + " logo"}
                      loading="lazy"
                      className="h-12 max-w-40 object-contain mb-4"
                    />
                  )}
                  {project.featured && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                      Featured platform
                    </p>
                  )}
                  {/* Top Bar: Project status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`}
                      />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Title & Industry */}
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  {project.industry && (
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                      {project.industry}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tech stack pills */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {techList.map((tech) => (
                        <span
                          key={tech}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Digital creation
                  </span>
                  <Link
                    href={"/projects/" + project.slug}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span>View project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
