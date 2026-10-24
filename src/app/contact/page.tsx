import type { Metadata } from "next";
import { Mail, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

const CONTACT = {
  name: "Soham Chotalia",
  email: "sohamssb102@gmail.com",
};

export default function ContactPage() {
  return (
    <div className="relative animate-fade-up">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-80 max-w-2xl rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-10 py-6 sm:py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Contact</p>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Get in touch</h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            This platform is always evolving. Please feel free to suggest any improvements and write to me on the email below — I&apos;d genuinely
            love to hear your ideas.
          </p>
        </header>

        <div className="w-full rounded-3xl border border-border-strong bg-surface p-6 sm:p-8">
          <dl className="flex flex-col">
            <div className="flex items-center gap-4 pb-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <User className="size-5" aria-hidden />
              </span>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-subtle">Name</dt>
                <dd className="mt-0.5 text-base font-semibold text-fg">{CONTACT.name}</dd>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-border pt-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <Mail className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-subtle">Contact email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="break-all text-base font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-8 w-full">
            <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("MarketQuest feedback")}`}>
              <Send /> Send feedback
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
