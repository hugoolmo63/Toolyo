export type ActiveCommitments = {
  pendingRequests: number;
  activeRentals: number;
};

export interface ActiveCommitmentsPort {
  countForListing(listingId: string): Promise<ActiveCommitments>;
}

export const noActiveCommitments: ActiveCommitmentsPort = {
  async countForListing() {
    return { pendingRequests: 0, activeRentals: 0 };
  },
};
