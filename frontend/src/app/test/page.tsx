import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { OlfactoryQuiz } from "@/features/olfactory-test/components/OlfactoryQuiz";
export const metadata: Metadata = { title: "Test olfativo | FullFragrance" };
export default function TestPage() { return <><Header active="test"/><OlfactoryQuiz/></>; }
