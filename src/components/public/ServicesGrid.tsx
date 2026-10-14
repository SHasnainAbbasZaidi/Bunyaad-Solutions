"use client";
import Link from "next/link";
import {useSiteSettings,sectionCopy} from "./SiteContext";
import {
  Building2,
  Users,
  ShoppingBag,
  Layers,
  Home,
  CalendarCheck,
  Code,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  shortDescription: string;
  targetAudience?: string | null;
  image?: string | null;
}

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  ShoppingBag,
  Layers,
  Home,
  CalendarCheck,
  Code,
  Cpu,
};

export function ServicesGrid({ services }: { services: ServiceItem[] }) {
  const settings=useSiteSettings();
  return (
    <section id="solutions" className="py-24 relative bg-zinc-50/60 dark:bg-[#070a16]/60 border-y border-zinc-200/60 dark:border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            What We Do
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {sectionCopy(settings,"services_title","Specialized Digital Platform Solutions")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            {sectionCopy(settings,"services_description","Technology solutions for businesses and consumers across B2B, B2C and D2C models.")}
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = (service.icon && iconMap[service.icon]) || Layers;

            return (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-850 hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-xs hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div>
                  {service.image&&<img src={service.image} alt={service.title} loading="lazy" className="h-36 w-full object-cover rounded-xl mb-5"/>}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
                    {service.shortDescription}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {service.targetAudience || "Enterprise & Commercial"}
                  </span>
                  <Link
                    href={"/solutions/"+service.slug}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Explore</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
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
