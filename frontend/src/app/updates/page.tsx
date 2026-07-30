/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-16
 */
import type { Metadata } from "next";
import Link from "next/link";
import { UPDATES } from "@/data/updates";
import "./updates.css";
import { renderMarkdownLite } from "@/lib/markdown-lite";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Changelog for the Chronograph timeline: what was added, verified, and changed, with dates and provenance.",
};


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
