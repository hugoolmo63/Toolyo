"use client";

import type { ListingDetailDTO } from "@/types/listing-detail";
import { useRouter } from "next/navigation";
import { Gallery } from "./gallery";
import { ListingHeader } from "./listing-header";
import { DescriptionSection } from "./description-section";
import { OwnerCard } from "./owner-card";
import { ReviewsSection } from "./reviews-section";
import { SimilarListings } from "./similar-listings";
import { InsuranceSection } from "./insurance-section";
import { RulesSection } from "./rules-section";
import { Calendar } from "./calendar";
import { PriceTable } from "./price-table";
import { ActionButtons } from "./action-buttons";
import dynamic from "next/dynamic";
import type { ReputationAggregate } from "@/features/reviews/presentation/reputation-summary";

const ListingLocationMap = dynamic(() => import("./listing-location-map").then((module) => module.ListingLocationMap), { ssr: false });

/**
 * ListingDetailPage — orquesta la ficha interactiva del detalle.
 * Recibe el detalle precargado como props iniciales para evitar flash de carga.
 * Ver spec.md FR-002 a FR-014 y contracts/listing-detail.md.
 */
interface ListingDetailPageProps {
  listing: ListingDetailDTO;
  reputation?: ReputationAggregate;
}

export function ListingDetailPage({ listing, reputation }: ListingDetailPageProps) {
  const router = useRouter();

  return (
    <div className="listing-detail-page">
      <div className="listing-detail-gallery-wrapper">
        <button
          type="button"
          className="listing-detail-back-button"
          onClick={() => router.back()}
          aria-label="Volver a la página anterior"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <Gallery photos={listing.photos} title={listing.title} />
      </div>

      <div className="listing-detail-layout">
        <div className="listing-detail-main">
          <ListingHeader listing={listing} />
          <DescriptionSection listing={listing} />

          <section className="listing-location-section" aria-labelledby="listing-location-heading">
            <h2 id="listing-location-heading">Ubicación aproximada</h2>
            <ListingLocationMap location={listing.location} />
            <p className="preferred-location-hint">La zona se muestra de forma aproximada para proteger la privacidad.</p>
          </section>

          <section className="listing-calendar-section" aria-labelledby="calendar-heading">
            <h2 id="calendar-heading">Disponibilidad</h2>
            <Calendar
              availability={listing.availability}
              pricePerDay={listing.pricePerDay}
            />
          </section>

          <PriceTable
            pricePerDay={listing.pricePerDay}
            priceTiers={listing.priceTiers}
            availability={listing.availability}
          />

          <ReviewsSection listing={listing} reputation={reputation} />
          <SimilarListings listing={listing} />
        </div>

        <aside className="listing-detail-sidebar">
          <div className="listing-sidebar-card">
            <p className="listing-sidebar-price">
              {listing.pricePerDay} €<small>/día</small>
            </p>
            <ActionButtons listing={listing} />
          </div>
          <OwnerCard owner={listing.owner} />
          <InsuranceSection listing={listing} />
          <RulesSection />
        </aside>
      </div>
    </div>
  );
}
