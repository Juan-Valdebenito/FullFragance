export type StorePrice = { id?: string; store: string; price: string; offer?: boolean };
export type Product = {
  id: string; brand: string; name: string; size: string; notes: string[];
  image?: string | null; imageCandidates?: string[]; prices: StorePrice[]; extraStoreCount?: number; badge?: string; aliases?: string[];
};
