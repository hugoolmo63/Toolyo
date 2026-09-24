/**
 * BookingStatusBadge — estado de la reserva con texto + badge (008-modulo-reservas, §11).
 * No depende solo del color: la etiqueta textual siempre acompaña.
 */
const statusConfig = {
  pending: { label: "Pendiente", className: "badge-warning" },
  accepted: { label: "Aceptada", className: "badge-success" },
  rejected: { label: "Rechazada", className: "badge-danger" },
  cancelled: { label: "Cancelada", className: "badge-danger" },
  active: { label: "Activa", className: "badge-success" },
  completed: { label: "Completada", className: "badge-neutral" },
} as const;

export type BookingStatusValue = keyof typeof statusConfig;

export function BookingStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as BookingStatusValue] ?? {
    label: status,
    className: "badge-neutral",
  };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
