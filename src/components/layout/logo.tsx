export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--surface-3)" />
        <path d="M7 21.5 12.5 15l4 3.5L25 9.5" fill="none" stroke="var(--up)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="9.5" r="2.2" fill="var(--brand)" />
      </svg>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          Market<span className="text-brand">Quest</span>
        </span>
      )}
    </span>
  );
}
