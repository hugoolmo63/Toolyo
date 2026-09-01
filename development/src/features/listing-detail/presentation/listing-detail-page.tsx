"use client";

import type { ListingDetailDTO } from "@/types/listing-detail";
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

/**
 * ListingDetailPage — orquesta la ficha interactiva del detalle.
 * Recibe el detalle precargado como props iniciales para evitar flash de carga.
 * Ver spec.md FR-002 a FR-014 y contracts/listing-detail.md.
 */
interface ListingDetailPageProps {
  listing: ListingDetailDTO;
}

export function ListingDetailPage({ listing }: ListingDetailPageProps) {
  return (
    <div className="listing-detail-page">
      <Gallery photos={listing.photos} title={listing.title} />

      <div className="listing-detail-layout">
        <div className="listing-detail-main">
          <ListingHeader listing={listing} />
          <DescriptionSection listing={listing} />

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

          <ReviewsSection listing={listing} />
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
