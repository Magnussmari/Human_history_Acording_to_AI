/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-16
 */
import type { Metadata } from "next";
import Link from "next/link";
import { UPDATES } from "@/data/updates";
import "./updates.css";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Changelog for the Chronograph timeline: what was added, verified, and changed, with dates and provenance.",
};

const MARKDOWN_LITE =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

function renderMarkdownLite(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(MARKDOWN_LITE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    if (match[1]) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] && match[3]) {
      const href = match[3];
      const label = match[2];
      if (href.startsWith("/")) {
        parts.push(
          <Link key={key++} href={href}>
            {label}
          </Link>,
        );
      } else {
        parts.push(
          <a key={key++} href={href}>
            {label}
          </a>,
        );
      }
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function UpdatesPage() {
  return (
    <div className="up">
      <div className="up-wrap">
        <div className="up-kicker">Changelog</div>
        <h1>Updates to the timeline</h1>
        <p className="up-lede">
          What was added, verified, and changed, with dates. This project is a
          glass box: the method and its revisions are part of the record.
        </p>

        <ol className="up-list">
          {UPDATES.map((u) => (
            <li className="up-item" key={`${u.date}-${u.title}`}>
              <div className="up-date">
                <time dateTime={u.date}>{u.date}</time>
                {u.version ? <span className="up-ver">{u.version}</span> : null}
              </div>
              <div>
                <h2 className="up-title">{u.title}</h2>
                <div className="up-body">{renderMarkdownLite(u.body)}</div>
                <div className="up-tags">
                  {u.tags.map((t) => (
                    <span className="up-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="up-foot">
          The full commit history lives on{" "}
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . For how the timeline is built and its honesty protocol, see the{" "}
          <Link href="/methodology">methodology</Link>.
        </p>
      </div>
    </div>
  );
}
