import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { BookingsList, BOOKINGS_PAGE_SIZE } from "@/features/bookings/presentation/bookings-list";

/**
 * Panel de reservas — Server Component (008-modulo-reservas, §5.2/§7).
 * Lista las reservas del usuario como arrendatario y/o arrendador con filtros
 * de rol y estado; la carga de páginas siguientes se hace con scroll infinito
 * en el cliente.
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
  searchParams: { role?: string; status?: string };
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
    limit: BOOKINGS_PAGE_SIZE,
  });

  const buildQuery = (overrides: { role?: Role; status?: Status }) => {
    const params = new URLSearchParams();
    const nextRole = overrides.role ?? role;
    const nextStatus = "status" in overrides ? overrides.status : status;
    if (nextRole !== "all") params.set("role", nextRole);
    if (nextStatus) params.set("status", nextStatus);
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
        <BookingsList
          role={role}
          status={status}
          initialItems={result.items}
          initialCursor={result.nextCursor}
        />
      )}
    </div>
  );
}
