import type { ConceptModule } from "@/lib/types";

/** Small decorative illustrations for concept cards. Purely visual (aria-hidden). */
export function ConceptPreview({ kind }: { kind: ConceptModule["preview"] }) {
  return (
    <svg viewBox="0 0 240 112" className="size-full" aria-hidden preserveAspectRatio="xMidYMid meet">
      {kind === "pie" && (
        <g transform="translate(120 56)">
          <circle r="34" fill="none" stroke="var(--surface-3)" strokeWidth="14" />
          <circle r="34" fill="none" stroke="#3987e5" strokeWidth="14" strokeDasharray="70 214" transform="rotate(-90)" />
          <circle r="34" fill="none" stroke="#199e70" strokeWidth="14" strokeDasharray="50 214" strokeDashoffset="-72" transform="rotate(-90)" />
          <circle r="34" fill="none" stroke="#d95926" strokeWidth="14" strokeDasharray="40 214" strokeDashoffset="-124" transform="rotate(-90)" />
          <circle r="34" fill="none" stroke="#9085e9" strokeWidth="14" strokeDasharray="30 214" strokeDashoffset="-166" transform="rotate(-90)" />
        </g>
      )}
      {kind === "line" && (
        <g>
          {[30, 56, 82].map((y) => (
            <line key={y} x1="24" x2="216" y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
          ))}
          <polyline
            points="24,70 50,62 76,66 102,44 128,50 154,30 180,58 216,40"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="216" cy="40" r="4" fill="var(--brand)" />
        </g>
      )}
      {kind === "bars" && (
        <g>
          {[38, 58, 30, 72, 48].map((h, i) => (
            <rect key={i} x={46 + i * 32} y={92 - h} width="20" height={h} rx="4" fill={i === 3 ? "var(--brand)" : "var(--surface-3)"} />
          ))}
          <line x1="36" x2="204" y1="92" y2="92" stroke="var(--border-strong)" />
        </g>
      )}
      {kind === "flow" && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={22 + i * 54} y="40" width="38" height="32" rx="8" fill={i === 0 ? "var(--brand)" : "var(--surface-3)"} />
              {i < 3 && (
                <>
                  <path d={`M${62 + i * 54} 56h9`} stroke="var(--subtle)" strokeWidth="2" />
                  <path d={`M${71 + i * 54} 52l5 4-5 4z`} fill="var(--subtle)" />
                </>
              )}
            </g>
          ))}
        </g>
      )}
      {kind === "book" && (
        <g>
          {[0, 1, 2].map((i) => (
            <rect key={`a${i}`} x={124} y={22 + i * 14} width={70 - i * 16} height="10" rx="3" fill="var(--down)" opacity={0.75 - i * 0.18} />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={`b${i}`} x={116 - (60 - i * 14)} y={62 + i * 14} width={60 - i * 14} height="10" rx="3" fill="var(--up)" opacity={0.75 - i * 0.18} />
          ))}
          <line x1="120" x2="120" y1="16" y2="102" stroke="var(--border-strong)" strokeDasharray="3 3" />
        </g>
      )}
      {kind === "gauge" && (
        <g transform="translate(120 84)">
          <path d="M-52 0A52 52 0 0 1 52 0" fill="none" stroke="var(--surface-3)" strokeWidth="12" strokeLinecap="round" />
          <path d="M-52 0A52 52 0 0 1 26 -45" fill="none" stroke="var(--brand)" strokeWidth="12" strokeLinecap="round" />
          <line x1="0" y1="0" x2="22" y2="-34" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
          <circle r="5" fill="var(--fg)" />
        </g>
      )}
    </svg>
  );
}
