import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { FeatureTabs } from "@/shared/components/FeatureTabs";
import { OlfactoryQuiz } from "@/features/olfactory-test/components/OlfactoryQuiz";

export const metadata: Metadata = { title: "Test olfativo | FullFragrance" };

export default function TestPage() {
  return (
    <>
      <Header active="test" />
      <div className="container" style={{ paddingTop: 24 }}>
        <FeatureTabs active="test" />
      </div>
      <OlfactoryQuiz />
    </>
  );
}
