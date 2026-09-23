export const bookingStatusHistoryTransitions = [
  { fromStatus: null, toStatus: "pending" as const, reason: "Solicitud de reserva" },
  { fromStatus: "pending" as const, toStatus: "accepted" as const, reason: null },
  { fromStatus: "pending" as const, toStatus: "rejected" as const, reason: "Fechas no disponibles" },
];
