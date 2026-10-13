"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
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
          <Moon className="h-4 w-4 text-upsa-navy transition-transform hover:-rotate-12" />
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
            <Sun className="h-4 w-4 text-upsa-navy transition-transform hover:rotate-45" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-white dark:bg-[#0D182E] border-gray-200 dark:border-white/15 shadow-xl">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 cursor-pointer font-medium text-xs",
            theme === "light" ? "text-upsa-gold font-bold" : "text-gray-700 dark:text-gray-200 hover:text-upsa-gold"
          )}
        >
          <Sun className="h-3.5 w-3.5" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 cursor-pointer font-medium text-xs",
            theme === "dark" ? "text-upsa-gold font-bold" : "text-gray-700 dark:text-gray-200 hover:text-upsa-gold"
          )}
        >
          <Moon className="h-3.5 w-3.5" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center gap-2 cursor-pointer font-medium text-xs",
            theme === "system" ? "text-upsa-gold font-bold" : "text-gray-700 dark:text-gray-200 hover:text-upsa-gold"
          )}
        >
          <Laptop className="h-3.5 w-3.5" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
