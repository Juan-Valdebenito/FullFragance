import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = { title: "Comparador de perfumes | FullFragrance" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return (
    <>
      <Header active="catalog" />
      <DashboardContent initialQuery={initialQuery} />
      <Footer />
    </>
  );
}
