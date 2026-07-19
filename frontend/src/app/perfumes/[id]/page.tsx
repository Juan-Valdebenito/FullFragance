import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";
export const metadata: Metadata = { title: "Detalle de perfume | FullFragrance" };
export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><Header active="catalog"/><ProductDetail productId={id}/><Footer/></>; }
