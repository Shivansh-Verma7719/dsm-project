"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/blog", label: "Research Blog" },
];

export function NavLinks() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // Avoid hydration flash — resolvedTheme is undefined on first SSR pass
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Header background flips with theme:
  //   light mode → var(--ink) = #111418 (dark header) → light link text
  //   dark mode  → var(--ink) = #f0ede8 (light header) → dark link text
  const isDark = mounted ? resolvedTheme === "dark" : false;
  const defaultColor = isDark ? "rgba(17,20,24,0.5)"    : "rgba(255,255,255,0.45)";
  const hoverColor   = isDark ? "rgba(17,20,24,0.9)"    : "rgba(255,255,255,0.9)";
  const activeColor  = "#d4943a"; // amber works on both backgrounds

  return (
    <nav
      className="flex gap-5"
      style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)", fontSize: "0.7rem", letterSpacing: "0.05em" }}
    >
      {links.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              color: isActive ? activeColor : defaultColor,
              transition: "color 0.15s",
              textDecoration: "none",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = hoverColor; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = defaultColor; }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
