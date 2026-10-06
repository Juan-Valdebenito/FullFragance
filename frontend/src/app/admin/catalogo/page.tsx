import type { Metadata } from "next";
import { CatalogSection } from "@/features/admin/components/CatalogSection";

export const metadata: Metadata = { title: "Catálogo · Admin" };

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  // La key reinicia el filtro cuando se busca desde la barra superior.
  return <CatalogSection key={initialQuery} initialQuery={initialQuery} />;
}
