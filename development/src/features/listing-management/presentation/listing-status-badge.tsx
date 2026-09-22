const statusStyles: Record<string, { label: string; variant: string }> = {
  draft: { label: "Borrador", variant: "badge-neutral" },
  in_review: { label: "En revisión", variant: "badge-warning" },
  published: { label: "Publicado", variant: "badge-success" },
  paused: { label: "Pausado", variant: "badge-warning" },
  rejected: { label: "Rechazado", variant: "badge-danger" },
};

export function ListingStatusBadge({ status }: { status: string }) {
  const { label, variant } = statusStyles[status] ?? { label: status, variant: "badge-neutral" };
  return <span className={`badge ${variant}`}>{label}</span>;
}
