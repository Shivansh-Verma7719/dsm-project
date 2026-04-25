import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitch } from "@/components/theme-switch";
import { NavLinks } from "@/components/nav-links";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Indian Securities Market: Empirical Dashboard",
  description: "Interactive dashboard exploring socioeconomic and behavioral determinants of household participation in the Indian securities market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header — editorial newspaper style */}
          <header className="sticky top-0 z-50 w-full" style={{ background: "var(--ink)", borderBottom: "1px solid var(--ink-2)" }}>
            <div className="container mx-auto flex h-12 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span 
                  className="font-mono text-xs tracking-widest uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  DSM Analytics
                </span>
                <span style={{ color: "var(--ink-3)", fontSize: "10px" }}>—</span>
                <span className="text-xs" style={{ color: "var(--ink-4)", fontFamily: "'DM Sans', sans-serif" }}>
                  India Securities Market Study
                </span>
              </div>
              <div className="flex items-center gap-6">
                <NavLinks />
                <ThemeSwitch />
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-6 py-10">
            {children}
          </main>

          <footer className="border-t py-6 px-6" style={{ borderColor: "var(--border)", background: "var(--paper-2)" }}>
            <div className="container mx-auto flex items-center justify-between">
              <p className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>
                DSM Project, Data Science Methods
              </p>
              <p className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>
                SEBI / Census 2011 / NSE Data
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
