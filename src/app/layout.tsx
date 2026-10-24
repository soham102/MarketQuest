import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
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
  title: {
    default: "MarketQuest — Learn the stock market by doing",
    template: "%s · MarketQuest",
  },
  description:
    "Interactive lessons and a 10-round virtual stock market simulation for Indian beginners. Educational only — no real money, no investment advice.",
};

export const viewport: Viewport = {
  themeColor: "#0a1020",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) add attributes to <html>/<body>
    // before React loads. This only ignores attribute differences on these two tags, not their children.
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
