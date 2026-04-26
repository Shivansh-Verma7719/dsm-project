"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/blog", label: "Research Blog" },
  { href: "/chat", label: "Sales AI" },
  { href: "/explore", label: "Data Explorer" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close menu on navigation
    setIsOpen(false);
  }, [pathname]);

  const defaultColorClass = "text-[#8a93a3]";
  const hoverColorClass   = "hover:text-[#c2c7d0]";
  const activeColorClass  = "text-[#d4943a]"; // amber

  if (!mounted) {
    return (
      <nav className="flex gap-5 opacity-0">
        {links.map((l) => <span key={l.href}>{l.label}</span>)}
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className="hidden md:flex gap-6 items-center relative z-10"
        style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)", fontSize: "0.7rem", letterSpacing: "0.05em" }}
      >
        {links.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                transition-colors duration-200 uppercase tracking-widest whitespace-nowrap
                ${isActive ? activeColorClass : `${defaultColorClass} ${hoverColorClass}`}
              `}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Toggle */}
      <div className="md:hidden flex items-center">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Toggle menu"
          onPress={() => setIsOpen(!isOpen)}
          className="text-white min-w-unit-8 w-8 h-8"
        >
          {isOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center gap-10 md:hidden animate-in fade-in duration-300"
          style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
        >
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => setIsOpen(false)}
            className="absolute top-4 right-6 text-white"
          >
            <IconX size={24} />
          </Button>
          
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  text-lg transition-colors duration-200 uppercase tracking-[0.2em]
                  ${isActive ? activeColorClass : "text-white/60 hover:text-white"}
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
