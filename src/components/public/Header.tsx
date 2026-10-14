"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSiteSettings } from "./SiteContext";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const settings = useSiteSettings();
  const defaultLinks = [
    { name: "Solutions", href: "/solutions" },
    { name: "Platforms", href: "/projects" },
    { name: "About", href: "/about" },
    { name: "Leadership", href: "/team" },
    { name: "News", href: "/news" },
    { name: "Contact", href: "/contact" },
  ];

  let navLinks=defaultLinks;
  try {if(settings.navigation)navLinks=JSON.parse(settings.navigation);}catch{}
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 dark:bg-[#060814]/85 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 shadow-xs"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Dark mode logo */}
            <div className="hidden dark:block relative h-10 w-44">
              <Image
                src="/brand/logo-dark.png"
                alt="Bunyaad Solutions Logo"
                fill
                sizes="176px"
                className="object-contain object-left group-hover:opacity-90 transition-opacity"
                priority
              />
            </div>
            {/* Light mode logo */}
            <div className="block dark:hidden relative h-10 w-44">
              <Image
                src="/brand/logo-light.png"
                alt="Bunyaad Solutions Logo"
                fill
                sizes="176px"
                className="object-contain object-left group-hover:opacity-90 transition-opacity"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Items */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <span>Partner With Us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-[#0a0e1e]/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 space-y-4 animate-fade-in-down">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Partner With Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
