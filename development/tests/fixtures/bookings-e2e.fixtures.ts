export type BookingE2ESession = {
  renterEmail: string;
  ownerEmail: string;
  listingSlug: string;
  startDate: string;
  endDate: string;
};

export function createBookingE2ESession(index: number): BookingE2ESession {
  const day = String((index % 20) + 1).padStart(2, "0");
  return {
    renterEmail: `e2e-renter-${index}@toolyo.dev`,
    ownerEmail: `e2e-owner-${index}@toolyo.dev`,
    listingSlug: `e2e-listing-${index}`,
    startDate: `2035-06-${day}`,
    endDate: `2035-06-${String((index % 20) + 2).padStart(2, "0")}`,
  };
}
