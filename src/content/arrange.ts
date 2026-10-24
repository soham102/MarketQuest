import type { KnowledgeCheck } from "@/lib/types";

/**
 * Questions are authored with the correct answer first for readability. This rotates the
 * options by a stable amount derived from the question id, so the correct answer's position
 * varies between questions but never changes between visits (stored answers stay valid).
 */
export function arrangeOptions(check: KnowledgeCheck): KnowledgeCheck {
  let hash = 0;
  for (const ch of check.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const n = check.options.length;
  const shift = hash % n;
  const options = check.options.map((_, i) => check.options[(i - shift + n) % n]);
  return { ...check, options, correctIndex: (check.correctIndex + shift) % n };
}
