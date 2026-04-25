"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/blog", label: "Research Blog" },
];

export function NavLinks() {
  const pathname = usePathname();

  // Avoid hydration flash — resolvedTheme is undefined on first SSR pass
  const defaultColor = "#8a93a3";
  const hoverColor   = "#c2c7d0";
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
