"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEME_COLORS, THEME_STORAGE_KEY } from "./theme-script";

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    document
      .getElementById("koetaw-theme-color")
      ?.setAttribute("content", THEME_COLORS[next]);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be blocked; the class change still applies.
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-11 w-11 shrink-0", className)}
      onClick={toggle}
      aria-label="Ganti tema"
      title="Ganti tema"
    >
      <Sun className="h-4 w-4 dark:hidden" aria-hidden />
      <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
    </Button>
  );
}
