"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "dropdown" | "button";
}

export function ThemeToggle({ className, variant = "dropdown" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full text-upsa-navy dark:text-gray-200 opacity-60",
          className
        )}
        aria-label="Theme toggle loading"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === "button") {
    const isDark = resolvedTheme === "dark";
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "h-9 w-9 rounded-full transition-colors text-upsa-navy dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-upsa-gold dark:hover:text-upsa-gold",
          className
        )}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-upsa-gold transition-transform hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-upsa-navy dark:text-upsa-gold transition-transform hover:-rotate-12" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full transition-colors text-upsa-navy dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-upsa-gold dark:hover:text-upsa-gold",
            className
          )}
          aria-label="Select color theme"
          title="Change theme"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-upsa-gold transition-transform hover:-rotate-12" />
          ) : (
            <Sun className="h-4 w-4 text-upsa-navy dark:text-upsa-gold transition-transform hover:rotate-45" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/15 shadow-xl rounded-xl p-1.5"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors",
            "focus:bg-gray-100 dark:focus:bg-white/10 focus:text-upsa-navy dark:focus:text-upsa-gold",
            theme === "light"
              ? "text-upsa-navy dark:text-upsa-gold font-bold bg-upsa-navy/5 dark:bg-white/5"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-upsa-gold" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors",
            "focus:bg-gray-100 dark:focus:bg-white/10 focus:text-upsa-navy dark:focus:text-upsa-gold",
            theme === "dark"
              ? "text-upsa-navy dark:text-upsa-gold font-bold bg-upsa-navy/5 dark:bg-white/5"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-upsa-gold" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors",
            "focus:bg-gray-100 dark:focus:bg-white/10 focus:text-upsa-navy dark:focus:text-upsa-gold",
            theme === "system"
              ? "text-upsa-navy dark:text-upsa-gold font-bold bg-upsa-navy/5 dark:bg-white/5"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-3.5 w-3.5 text-slate-400" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-upsa-gold" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
