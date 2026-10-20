import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { api } from "@/shared/api/client";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Comparador de perfumes",
  description:
    "Explora y compara precios de miles de perfumes originales entre Falabella, Ripley, Paris, ABC y otras tiendas verificadas de Chile. Filtra por marca, notas olfativas y mejores ofertas.",
  alternates: { canonical: "/dashboard" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const catalogParams = new URLSearchParams({
    comparison: initialQuery ? "all" : "multiple",
    pageSize: "12",
  });
  if (initialQuery) catalogParams.set("q", initialQuery);
  const initialResult = await api.searchCatalog(catalogParams, {
    authenticated: false,
    next: { revalidate: 3600 },
  }).catch(() => null);

  return (
    <>
      <Header active="catalog" />
      <DashboardContent initialQuery={initialQuery} initialResult={initialResult} />
      <Footer />
    </>
  );
}
