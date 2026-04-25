"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { IconSunset2Filled, IconHazeMoon } from "@tabler/icons-react";

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      isIconOnly
      aria-label="Toggle theme"
      className="group cursor-pointer"
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <IconSunset2Filled className="text-black group-hover:text-white group-hover:scale-110 transition-all duration-400 ease-in-out" />
      ) : (
        <IconHazeMoon className="text-white group-hover:text-black group-hover:scale-110 transition-all duration-400 ease-in-out" />
      )}
    </Button>
  );
}
