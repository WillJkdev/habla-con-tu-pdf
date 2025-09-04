"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="hover:scale-105 transition-transform"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-all hover:text-yellow-400" />
      ) : (
        <Moon className="h-4 w-4 transition-all hover:text-blue-400" />
      )}
      <span className="sr-only">
        {theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      </span>
    </Button>
  );
}
