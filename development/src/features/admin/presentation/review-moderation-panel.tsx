"use client";

export function ReviewModerationPanel({ reports }: { reports: Array<{ id: string; status: string; reason: string }> }) { return <section aria-label="Moderación de reviews"><h2>Reportes de reviews</h2><ul>{reports.map((report) => <li key={report.id}>{report.reason} — {report.status}</li>)}</ul></section>; }