import type { Metadata } from "next";
import { ReviewsSection } from "@/features/admin/components/ReviewsSection";

export const metadata: Metadata = { title: "Reseñas · Admin" };

export default function AdminReviewsPage() {
  return <ReviewsSection />;
}
