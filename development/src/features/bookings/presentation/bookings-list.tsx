"use client";

import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/lib/trpc-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { BookingStatusBadge } from "./booking-status-badge";
import { formatEur } from "./booking-summary";

/**
 * BookingsList — lista de reservas con scroll infinito (008-modulo-reservas).
 * La primera página llega precargada desde el Server Component; el centinela
 * solicita las siguientes por cursor sin botones ni navegación.
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;
type BookingItem = RouterOutputs["booking"]["list"]["items"][number];

export const BOOKINGS_PAGE_SIZE = 20;

type BookingRole = "renter" | "owner" | "all";
type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled" | "active" | "completed";

interface BookingsListProps {
  role: BookingRole;
  status?: BookingStatus;
  initialItems: BookingItem[];
  initialCursor: string | null;
}

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function BookingsList({ role, status, initialItems, initialCursor }: BookingsListProps) {
  const listQuery = api.booking.list.useInfiniteQuery(
    { role, status, limit: BOOKINGS_PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [{ items: initialItems, nextCursor: initialCursor }],
        pageParams: [undefined],
      },
    },
  );

  const bookings = listQuery.data?.pages.flatMap((page) => page.items) ?? initialItems;

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: Boolean(listQuery.hasNextPage) && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage();
    },
  });

  return (
    <>
      <ul className="conversation-list booking-list">
        {bookings.map((booking) => (
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

      {listQuery.hasNextPage && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-live="polite">
          <span className="loading-more">Cargando más reservas...</span>
        </div>
      )}
    </>
  );
}
