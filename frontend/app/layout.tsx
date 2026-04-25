import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitch } from "@/components/theme-switch";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSM Project",
  description: "A Financial Inclusion Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b border-divider bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
              <div className="font-bold text-lg tracking-tight">DSM Analytics</div>
              <div className="flex items-center gap-4">
                <nav className="flex gap-4 text-sm font-medium">
                  <a href="/" className="hover:text-primary transition-colors">Dashboard</a>
                  <a href="/blog" className="hover:text-primary transition-colors">Research Blog</a>
                </nav>
                <ThemeSwitch />
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
