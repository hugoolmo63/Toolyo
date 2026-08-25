import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "var(--ps-space-8, 32px) var(--ps-space-6, 24px)",
      }}
    >
      {children}
    </main>
  );
}