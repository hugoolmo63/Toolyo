"use client";

import type { ListingDetailDTO } from "@/types/listing-detail";
import { Gallery } from "./gallery";
import { ListingHeader } from "./listing-header";
import { DescriptionSection } from "./description-section";
import { OwnerCard } from "./owner-card";
import { ReviewsSection } from "./reviews-section";
import { SimilarListings } from "./similar-listings";
import { RulesSection } from "./rules-section";
import { Calendar } from "./calendar";
import { PriceTable } from "./price-table";
import { ActionButtons } from "./action-buttons";
import dynamic from "next/dynamic";
import type { ReputationAggregate } from "@/features/reviews/presentation/reputation-summary";
import { FavoritePicker } from "@/features/favorites/presentation/favorite-picker";

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
  return (
    <div className="listing-detail-page">
      <div className="listing-detail-gallery-wrapper">
        <Gallery photos={listing.photos} title={listing.title} />
        <FavoritePicker listingId={listing.id} />
      </div>

      <div className="listing-detail-layout">
        <div className="listing-detail-main">
          <ListingHeader listing={listing} />
          <DescriptionSection listing={listing} />

          <section className="listing-location-section" aria-labelledby="listing-location-heading">
            <h2 id="listing-location-heading">Ubicación aproximada</h2>
            <ListingLocationMap location={listing.location} />
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
          <RulesSection />
        </aside>
      </div>
    </div>
  );
}
