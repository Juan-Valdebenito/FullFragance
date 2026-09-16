import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProfileSummary } from "@/features/profile/components/ProfileSummary";
import { AccountSettings } from "@/features/profile/components/AccountSettings";
import { ProfileShortcuts } from "@/features/profile/components/ProfileShortcuts";
import styles from "./profile.module.css";

export const metadata: Metadata = { title: "Mi cuenta | FullFragrance" };

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Tu cuenta"
          title="Mi perfil"
          description="Administra tus datos, preferencias y configuración regional."
        />
        <div className={`container ${styles.main}`}>
          <ProfileSummary />
          <div className={styles.profileGrid}>
            <AccountSettings />
            <ProfileShortcuts />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
