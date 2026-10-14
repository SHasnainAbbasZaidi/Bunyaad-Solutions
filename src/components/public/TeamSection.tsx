"use client";
import {useSiteSettings,sectionCopy} from "./SiteContext";
import { Sparkles } from "lucide-react";

interface Member {
  id: string;
  name: string;
  photo?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  designation: string;
  department?: string | null;
  biography?: string | null;
  skills?: string | null;
  linkedin?: string | null;
  isFounder: boolean;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

export function TeamSection({ teamMembers }: { teamMembers: Member[] }) {
  const settings=useSiteSettings();
  const founders = teamMembers.filter((m) => m.isFounder);
  const coreTeam = teamMembers.filter((m) => !m.isFounder);

  return (
    <section id="team" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Leadership & Visionaries
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {sectionCopy(settings,"team_title","Meet the Founders & Team")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            {sectionCopy(settings,"team_description","The people building our digital platforms. Verified profiles will be shared here.")}
          </p>
        </div>

        {!teamMembers.length&&<p className="text-center">Team profiles will be available soon.</p>}
        {/* Founding Partners Featured Cards */}
        <div className={founders.length?"mb-14":"hidden"}>
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-md border border-blue-200/50 dark:border-blue-800/50">
              Founding Partners
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {founders.map((founder) => {
              let skillsList: string[] = [];
              try {
                if (founder.skills) {const parsed=JSON.parse(founder.skills);skillsList=Array.isArray(parsed)?parsed.filter(s=>typeof s==="string"):[];}
              } catch {
                skillsList = [];
              }

              return (
                <div
                  key={founder.id}
                  className="relative p-8 rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/30 bg-gradient-to-b from-white to-blue-50/20 dark:from-zinc-900/90 dark:to-blue-950/20 shadow-md hover:shadow-xl hover:border-blue-500/60 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      Co-Founder
                    </span>

                    {founder.linkedin && (
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-blue-600 transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                        <LinkedInIcon className="w-5 h-5" />
                      </a>
                    )}
                  </div>

                  {founder.photo&&<img src={founder.photo} alt={founder.name} loading="lazy" className="h-28 w-28 object-cover rounded-2xl mb-5"/>}
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {founder.name}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {founder.designation}
                  </p>

                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-4 leading-relaxed">
                    {founder.biography}
                  </p>

                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                      {skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Leadership & Engineering Leads */}
        {coreTeam.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Core Leadership & Technical Leads
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {coreTeam.map((member) => (
                <div
                  key={member.id}
                  className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  {member.photo&&<img src={member.photo} alt={member.name} loading="lazy" className="h-24 w-24 object-cover rounded-xl mb-4"/>}
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {member.name}
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    {member.designation}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 line-clamp-3">
                    {member.biography}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
