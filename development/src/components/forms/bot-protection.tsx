"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; theme?: "light" | "dark" }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function BotProtection({ value, onChange }: { value: string; onChange: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    let widgetId: string | null = null;
    const mountWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetId) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChangeRef.current(token),
        "expired-callback": () => onChangeRef.current(""),
        "error-callback": () => onChangeRef.current(""),
        theme: "light",
      });
    };
    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (existing) {
      mountWidget();
      existing.addEventListener("load", mountWidget);
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.addEventListener("load", mountWidget);
      document.head.appendChild(script);
    }
    return () => {
      if (widgetId) window.turnstile?.remove(widgetId);
      existing?.removeEventListener("load", mountWidget);
    };
  }, []);

  if (SITE_KEY) return <div ref={containerRef} className="bot-protection" aria-label="Verificación No soy un robot" />;

  return (
    <label className="check-row bot-protection-local">
      <input type="checkbox" checked={value === "development-human-check"} onChange={(event) => onChange(event.target.checked ? "development-human-check" : "")} />
      <span>No soy un robot</span>
    </label>
  );
}