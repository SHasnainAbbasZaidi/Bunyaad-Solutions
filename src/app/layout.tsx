import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SiteSettingsProvider } from "@/components/public/SiteContext";
import { getSettings } from "@/lib/public-content";
import { settingKeys } from "@/lib/cms-config";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    title: {
      default:
        settings.seo_title ||
        "Bunyaad Solutions — Digital Platforms & Innovation",
      template: "%s | " + (settings.site_name || "Bunyaad Solutions"),
    },
    description:
      settings.seo_description ||
      "Building the Foundation of Digital Innovation.",
    openGraph: {
      siteName: settings.site_name || "Bunyaad Solutions",
      type: "website",
      images: [settings.logo_light || "/brand/logo-light.png"],
    },
    icons: {
      icon: [
        {
          url: settings.icon_light || "/brand/icon-light.png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: settings.icon_dark || "/brand/icon-dark.png",
          media: "(prefers-color-scheme: dark)",
        },
      ],
    },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const safeSettings = Object.fromEntries(
    Object.entries(settings).filter(([key]) => settingKeys.includes(key)),
  );
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme={settings.theme_default || "dark"}
          enableSystem
          disableTransitionOnChange
        >
          <SiteSettingsProvider value={safeSettings}>
            {children}
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
