"use client";

import { useEffect, useState } from "react";
import type { PublicListingCard, PublicReview } from "@/features/users/domain/public-user-profile";
import { UserProfileListings } from "./UserProfileListings";
import { UserProfileReviews } from "./UserProfileReviews";

type ProfileTab = "listings" | "reviews";

export function UserProfileTabs({ listings, reviews }: { listings: PublicListingCard[]; reviews: PublicReview[] }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");

  useEffect(() => {
    const selectFromHash = () => {
      if (window.location.hash === "#profile-reviews") setActiveTab("reviews");
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  function selectTab(tab: ProfileTab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", tab === "reviews" ? "#profile-reviews" : "#profile-listings");
  }

  return (
    <section className="user-profile-tabs" aria-label="Contenido del perfil">
      <div className="user-profile-tab-list" role="tablist" aria-label="Listings y reseñas">
        <button type="button" role="tab" aria-selected={activeTab === "listings"} className={activeTab === "listings" ? "active" : ""} onClick={() => selectTab("listings")}>
          Productos activos <span>{listings.length}</span>
        </button>
        <button id="profile-reviews" type="button" role="tab" aria-selected={activeTab === "reviews"} className={activeTab === "reviews" ? "active" : ""} onClick={() => selectTab("reviews")}>
          Reseñas <span>{reviews.length}</span>
        </button>
      </div>
      <div role="tabpanel" aria-label={activeTab === "listings" ? "Productos activos" : "Reseñas"}>
        {activeTab === "listings" ? <UserProfileListings listings={listings} /> : <UserProfileReviews reviews={reviews} />}
      </div>
    </section>
  );
}