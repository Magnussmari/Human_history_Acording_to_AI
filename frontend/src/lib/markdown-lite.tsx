/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-29
 *
 * Minimal inline-markdown renderer — **bold**, *italic*, [label](href).
 *
 * Two places need it and neither wants a markdown dependency:
 *   - the /updates changelog, whose entries are plain strings in a data file
 *   - the Layer-2 era dossiers, whose table cells arrive from the research
 *     pipeline carrying markdown ("**Plato's Academy**", "*Republic* Book VII").
 *     Those were rendering as literal asterisks on the live site, which reads as
 *     broken on a project whose whole claim is scholarly care.
 *
 * Deliberately NOT a markdown parser: no block syntax, no HTML passthrough, no
 * sanitiser surface. Anything it does not recognise is emitted as plain text.
 */
import Link from "next/link";
import type React from "react";

// Order matters: ** before * so bold is not eaten by the italic branch.
// [\s\S] rather than `.` because several dossier fields (coreQuestion,
// crossRefL1) are multi-line and `.` stops at the newline, leaving the emphasis
// on screen as literal asterisks. Written this way rather than with the `s`
// flag, which would require raising the project's ES2017 target for one regex.
const INLINE = /\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function renderMarkdownLite(text: string): React.ReactNode {
  if (!text || !/[*[]/.test(text)) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));

    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const label = match[3];
      const href = match[4];
      parts.push(
        href.startsWith("/") ? (
          <Link key={key++} href={href}>
            {label}
          </Link>
        ) : (
          <a key={key++} href={href} rel="noreferrer">
            {label}
          </a>
        ),
      );
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}
