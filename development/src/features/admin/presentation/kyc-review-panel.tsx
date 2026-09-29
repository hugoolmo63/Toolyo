"use client";

export function KycReviewPanel({ verificationId }: { verificationId?: string }) { return <section aria-label="Revisión KYC"><h2>Verificaciones KYC</h2><p>{verificationId ? `Revisando ${verificationId}` : "Selecciona una verificación pendiente."}</p></section>; }