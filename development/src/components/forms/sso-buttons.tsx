"use client";

import type { SsoProvider } from "@/types/auth";

const providers: { id: SsoProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
];

export function SsoButtons({ enabled = [] }: { enabled?: SsoProvider[] }) {
  return <div className="sso-row">{providers.map((provider) => <button key={provider.id} type="button" disabled={!enabled.includes(provider.id)} aria-label={`Continuar con ${provider.label}`}>{provider.label}</button>)}</div>;
}
