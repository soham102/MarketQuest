"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, CandlestickChart, ClipboardList, Home, Mail, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store/store";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";
import { TourHelper } from "@/components/tour/guided-tour";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/learn", label: "Learn", icon: BookOpen, match: (p: string) => p.startsWith("/learn") },
  {
    href: "/simulate",
    label: "Simulate",
    icon: CandlestickChart,
    match: (p: string) => p.startsWith("/simulate") && !p.startsWith("/simulate/report"),
  },
  { href: "/simulate/report", label: "Report", icon: ClipboardList, match: (p: string) => p.startsWith("/simulate/report") },
  { href: "/contact", label: "Contact", icon: Mail, match: (p: string) => p.startsWith("/contact") },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { storageError } = useStore();

  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-brand px-3 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
            <Link href="/" className="flex items-center gap-2 rounded-md" aria-label="MarketQuest home">
              <Logo />
            </Link>
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {NAV.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                  data-tour={`nav-${item.label.toLowerCase()}`}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
                        )}
                      >
                        <item.icon className="size-4" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-[11px] font-medium text-warn">
                Virtual money only
              </span>
              <div data-tour="header-account">
              <UserMenu />
            </div>
            </div>
          </div>
        </header>

        {storageError && (
          <div role="status" className="border-b border-warn/30 bg-warn/10">
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-warn sm:px-6">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {storageError}
            </div>
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 md:pb-16">
          {children}
        </main>

        <footer className="border-t border-border pb-20 md:pb-0">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="flex items-center gap-3 text-sm text-muted">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/90 text-brand-fg">
                <Boxes className="size-4" aria-hidden />
              </span>
              <span>
                Created by <span className="font-semibold text-fg">Soham Chotalia</span>
              </span>
            </p>
            <a
              href="mailto:sohamssb102@gmail.com"
              className="flex w-fit items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-fg"
            >
              <Mail className="size-4" aria-hidden />
              sohamssb102@gmail.com
            </a>
          </div>
          <div className="border-t border-border/60">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                MarketQuest is an educational simulator. All companies, news and prices are fictional. Nothing here is investment advice.
              </p>
              <div className="flex shrink-0 gap-4">
                <Link href="/contact" className="underline-offset-4 hover:text-fg hover:underline">
                  Contact
                </Link>
                <Link href="/data" className="underline-offset-4 hover:text-fg hover:underline">
                  Your data &amp; privacy
                </Link>
              </div>
            </div>
          </div>
        </footer>

        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md md:hidden">
          <ul className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                  data-tour={`nav-${item.label.toLowerCase()}`}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                      active ? "text-brand" : "text-subtle",
                    )}
                  >
                    <item.icon className="size-5" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <TourHelper />
      </div>
    </AuthProvider>
  );
}
