
export type MarketplaceStore = {
  id: string;
  marketplace_name?: string; // Made optional to match new schema
  store_name: string;
  platform: string;
  created_at: string; // ISO string
};
