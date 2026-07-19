export type StorePrice = { store: string; price: string; offer?: boolean };
export type Product = {
  id: string; brand: string; name: string; size: string; notes: string[];
  image: string; prices: StorePrice[]; badge?: string;
};
