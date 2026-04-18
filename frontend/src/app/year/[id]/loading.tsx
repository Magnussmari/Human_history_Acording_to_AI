/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */

export default function YearLoading() {
  return (
    <div
      className="notebook-folio"
      style={{ paddingTop: 64 }}
      aria-busy="true"
    >
      <span
        className="notebook-folio-back"
        style={{ background: "var(--rule-soft, var(--bg-2))", color: "transparent", borderRadius: 2 }}
      >
        ← Back to timeline
      </span>

      <div
        style={{
          height: 20,
          width: 200,
          background: "var(--rule-soft, var(--bg-2))",
          borderRadius: 2,
          marginTop: 40,
          animation: "notebook-shimmer 1.4s ease-in-out infinite",
        }}
      />

      <div
        style={{
          height: 150,
          width: "min(580px, 90%)",
          background: "var(--rule-soft, var(--bg-2))",
          borderRadius: 2,
          marginTop: 24,
          animation: "notebook-shimmer 1.4s ease-in-out infinite",
          animationDelay: "0.08s",
        }}
      />

      <div
        style={{
          marginTop: 36,
          display: "grid",
          gap: 10,
          maxWidth: 640,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 16,
              background: "var(--rule-soft, var(--bg-2))",
              borderRadius: 2,
              width: `${100 - i * 12}%`,
              animation: "notebook-shimmer 1.4s ease-in-out infinite",
              animationDelay: `${0.16 + i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 56,
          display: "grid",
          gap: 24,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: 16,
              paddingBottom: 24,
              borderBottom: "1px solid var(--rule)",
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div
              style={{
                height: 7,
                width: 7,
                borderRadius: "50%",
                background: "var(--stamp)",
                marginTop: 10,
                opacity: 0.4,
              }}
            />
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  height: 20,
                  background: "var(--rule-soft, var(--bg-2))",
                  borderRadius: 2,
                  width: "80%",
                  animation: "notebook-shimmer 1.4s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  height: 14,
                  background: "var(--rule-soft, var(--bg-2))",
                  borderRadius: 2,
                  width: "100%",
                  animation: "notebook-shimmer 1.4s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  height: 14,
                  background: "var(--rule-soft, var(--bg-2))",
                  borderRadius: 2,
                  width: "72%",
                  animation: "notebook-shimmer 1.4s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
