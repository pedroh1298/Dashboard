import type { CompleteListingResponse, ListingMarketplace, ProductCondition } from '@/services/ai';

export interface SavedListing {
  id: string;
  productName: string;
  marketplace: ListingMarketplace;
  condition: ProductCondition;
  listing: CompleteListingResponse;
  createdAt: string;
  updatedAt: string;
}
