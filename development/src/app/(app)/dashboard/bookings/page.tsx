import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { BookingStatusBadge } from "@/features/bookings/presentation/booking-status-badge";
import { formatEur } from "@/features/bookings/presentation/booking-summary";

/**
 * Panel de reservas — Server Component (008-modulo-reservas, §5.2/§7).
 * Lista las reservas del usuario como arrendatario y/o arrendador con filtros
 * de rol y estado; cada elemento enlaza a la conversación asociada.
 */

const roleTabs = [
  ["all", "Todas"],
  ["renter", "Como arrendatario"],
  ["owner", "Como arrendador"],
] as const;

const statusTabs = [
  ["pending", "Pendientes"],
  ["accepted", "Aceptadas"],
  ["active", "Activas"],
  ["completed", "Completadas"],
  ["rejected", "Rechazadas"],
  ["cancelled", "Canceladas"],
] as const;

type Role = (typeof roleTabs)[number][0];
type Status = (typeof statusTabs)[number][0];

interface BookingsPageProps {
  searchParams: { role?: string; status?: string; cursor?: string };
}

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) {
    redirect(`/auth?tab=login&callback=${encodeURIComponent("/dashboard/bookings")}`);
  }

  const role: Role = roleTabs.some(([value]) => value === searchParams.role)
    ? (searchParams.role as Role)
    : "all";
  const status: Status | undefined = statusTabs.some(([value]) => value === searchParams.status)
    ? (searchParams.status as Status)
    : undefined;

  const result = await api.booking.list({
    role,
    status,
    cursor: searchParams.cursor,
    limit: 20,
  });

  const buildQuery = (overrides: { role?: Role; status?: Status; cursor?: string }) => {
    const params = new URLSearchParams();
    const nextRole = overrides.role ?? role;
    const nextStatus = "status" in overrides ? overrides.status : status;
    const nextCursor = "cursor" in overrides ? overrides.cursor : undefined;
    if (nextRole !== "all") params.set("role", nextRole);
    if (nextStatus) params.set("status", nextStatus);
    if (nextCursor) params.set("cursor", nextCursor);
    const query = params.toString();
    return `/dashboard/bookings${query ? `?${query}` : ""}`;
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Reservas</h1>
      </div>

      <nav className="booking-filters" aria-label="Filtrar por rol">
        {roleTabs.map(([value, label]) => (
          <Link
            key={value}
            href={buildQuery({ role: value })}
            className={`booking-filter${role === value ? " is-active" : ""}`}
            aria-current={role === value ? "true" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      <nav className="booking-filters" aria-label="Filtrar por estado">
        <Link
          href={buildQuery({ status: undefined })}
          className={`booking-filter${!status ? " is-active" : ""}`}
          aria-current={!status ? "true" : undefined}
        >
          Todos los estados
        </Link>
        {statusTabs.map(([value, label]) => (
          <Link
            key={value}
            href={buildQuery({ status: value })}
            className={`booking-filter${status === value ? " is-active" : ""}`}
            aria-current={status === value ? "true" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {result.items.length === 0 ? (
        <section className="dashboard-section">
          <p className="empty-state-message">
            No tienes reservas con estos filtros. Solicita una desde la ficha de un producto.
          </p>
          <Link href="/" className="dashboard-link">
            Buscar productos →
          </Link>
        </section>
      ) : (
        <ul className="conversation-list booking-list">
          {result.items.map((booking) => (
            <li key={booking.id} data-testid="booking-list-item">
              <div className="conversation-item booking-item">
                <div className="conversation-item-main">
                  <strong className="conversation-item-name">
                    <Link href={`/listings/${booking.listing.slug}`}>{booking.listing.title}</Link>
                  </strong>
                  <span className="conversation-item-listing">
                    {formatDay(booking.startDate)} – {formatDay(booking.endDate)} ·{" "}
                    {formatEur(booking.financials.totalPrice)}
                  </span>
                  <span className="conversation-item-preview">
                    Arrendatario: {booking.renter.displayName ?? "—"} · Arrendador:{" "}
                    {booking.owner.displayName ?? "—"}
                  </span>
                  {booking.status === "rejected" && booking.rejectionReason && (
                    <span className="conversation-item-preview">
                      Motivo: {booking.rejectionReason}
                    </span>
                  )}
                </div>
                <div className="conversation-item-meta">
                  <BookingStatusBadge status={booking.status} />
                  {booking.conversationId && (
                    <Link
                      href={`/messages/${booking.conversationId}?booking=${booking.id}`}
                      className="dashboard-link"
                    >
                      Ver conversación →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor && (
        <p>
          <Link href={buildQuery({ cursor: result.nextCursor })} className="dashboard-link">
            Ver más reservas →
          </Link>
        </p>
      )}
    </div>
  );
}
