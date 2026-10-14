import Link from "@/components/SiteLink";
import { brandHero, defaultHighlights } from "@/lib/branding";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroData {
  backgroundImage?: string | null;
  visualSettings?: string;
  headline?: string;
  subtitle?: string;
  description?: string;
  ctaPrimaryText?: string;
  ctaPrimaryUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
}

export function HeroSection({
  hero,
  highlights = defaultHighlights,
}: {
  hero?: HeroData;
  highlights?: typeof defaultHighlights;
}) {
  const headline = hero?.headline ?? brandHero.headline;
  const subtitle = hero?.subtitle ?? brandHero.subtitle;
  const description = hero?.description ?? brandHero.description;
  const ctaPrimaryText = hero?.ctaPrimaryText ?? brandHero.ctaPrimaryText;
  const ctaPrimaryUrl = hero?.ctaPrimaryUrl ?? brandHero.ctaPrimaryUrl;
  const ctaSecondaryText = hero?.ctaSecondaryText ?? brandHero.ctaSecondaryText;
  const ctaSecondaryUrl = hero?.ctaSecondaryUrl ?? brandHero.ctaSecondaryUrl;

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-500/15 dark:bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={
            "max-w-4xl mx-auto space-y-8 " +
            (hero?.visualSettings === "left" ? "text-left" : "text-center")
          }
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur animate-fade-in-down shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>{subtitle}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
            {headline}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mx-auto">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={ctaPrimaryUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{ctaPrimaryText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {ctaSecondaryText && ctaSecondaryUrl && (
              <Link
                href={ctaSecondaryUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-base backdrop-blur transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{ctaSecondaryText}</span>
              </Link>
            )}
          </div>

          {hero?.backgroundImage && (
            <img
              src={hero.backgroundImage}
              alt=""
              className="w-full max-h-96 rounded-2xl object-cover"
            />
          )}
          {!!highlights.length && (
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {highlights.map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40"
                >
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
