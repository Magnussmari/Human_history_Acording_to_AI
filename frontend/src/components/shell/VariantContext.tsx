/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type Variant = "a" | "b" | "c";

interface VariantCtx {
  variant: Variant;
  setVariant: (v: Variant) => void;
}

const Ctx = createContext<VariantCtx | null>(null);
const STORAGE_KEY = "chronograph-variant";

function readStoredVariant(): Variant {
  if (typeof window === "undefined") return "a";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "a" || raw === "b" || raw === "c") return raw;
  } catch {
    /* noop */
  }
  return "a";
}

export function VariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<Variant>(readStoredVariant);

  const setVariant = useCallback((v: Variant) => {
    setVariantState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* noop */
    }
  }, []);

  return <Ctx.Provider value={{ variant, setVariant }}>{children}</Ctx.Provider>;
}

export function useVariant(): VariantCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVariant must be used within VariantProvider");
  return ctx;
}
