import { navigationLinks } from "@/lib/branding";
import Image from "next/image";
import Link from "@/components/SiteLink";
import { getSettings } from "@/lib/public-content";
export async function Footer() {
  const settings = await getSettings();
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <Link href="/">
            <Image
              className="dark:hidden h-auto"
              style={{ height: "auto" }}
              src={settings.logo_light || "/brand/logo-light.png"}
              alt={settings.site_name || "Bunyaad Solutions"}
              width={176}
              height={60}
            />
            <Image
              className="hidden dark:block h-auto"
              style={{ height: "auto" }}
              src={settings.logo_dark || "/brand/logo-dark.png"}
              alt={settings.site_name || "Bunyaad Solutions"}
              width={176}
              height={60}
            />
          </Link>
          {settings.site_tagline && (
            <p className="mt-4 font-semibold">{settings.site_tagline}</p>
          )}
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {settings.footer_content ||
              "Building the Foundation of Digital Innovation."}
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-3 text-sm">
          {navigationLinks(
            settings.footer_navigation ?? settings.navigation,
          ).map(({ name, href }) => (
            <Link key={name} href={href}>
              {name}
            </Link>
          ))}
        </nav>
        <div className="text-sm space-y-3">
          {settings.contact_email && (
            <p>
              <a href={"mailto:" + settings.contact_email}>
                {settings.contact_email}
              </a>
            </p>
          )}
          {settings.contact_phone && <p>{settings.contact_phone}</p>}
          {settings.contact_address && <p>{settings.contact_address}</p>}
          {[
            ["LinkedIn", settings.linkedin_url],
            ["X / Twitter", settings.twitter_url],
          ]
            .filter(([, url]) => url)
            .map(([label, url]) => (
              <a
                className="mr-4"
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
        </div>
        <p className="text-xs text-zinc-500 md:col-span-3">
          © {new Date().getFullYear()}{" "}
          {settings.site_name || "Bunyaad Solutions"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
