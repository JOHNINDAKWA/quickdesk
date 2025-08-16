import { createContext, useContext } from "react";

export type Plan = "Free" | "Standard" | "Premium" | "Enterprise";
export type Org = {
  slug: string;
  name: string;
  plan?: Plan;
  logo?: string;
  brandColor?: string;
};

const OrgContext = createContext<Org | null>(null);

export function OrgProvider({ value, children }: { value: Org; children: React.ReactNode }) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg() must be used within <OrgProvider>");
  return ctx;
}

/** Backend-ready fetch. For now it falls back to a friendly stub in dev. */
export async function fetchOrg(slug: string): Promise<Org | null> {
  try {
    const res = await fetch(`/api/orgs/${encodeURIComponent(slug)}`, { credentials: "include" });
    if (res.ok) return (await res.json()) as Org;
  } catch (_) {}
  // DEV fallback so you can click around
  if (!slug) return null;
  const name = slug
    .split("-")
    .map((s) => (s[0] ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
  return { slug, name, plan: "Standard" };
}
