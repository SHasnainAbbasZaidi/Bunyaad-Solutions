"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/40 bg-surface/50 text-muted-foreground"
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle light or dark theme"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/50 bg-background/60 hover:bg-muted/80 backdrop-blur transition-all duration-200 text-foreground cursor-pointer shadow-sm hover:scale-105"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
      ) : (
        <Moon className="w-4 h-4 text-brand-600 transition-transform rotate-0" />
      )}
    </button>
  );
}
