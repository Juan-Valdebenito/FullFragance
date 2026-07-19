import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { ProfileSummary } from "@/features/profile/components/ProfileSummary";
import { CitySettings } from "@/features/profile/components/CitySettings";
import styles from "./profile.module.css";
export const metadata: Metadata = { title: "Mi cuenta | FullFragrance" };
export default function ProfilePage() { return <><Header/><main className={`container ${styles.main}`}><ProfileSummary/><section className={styles.settings}><p className="eyebrow">Preferencias regionales</p><h2>Tu ciudad</h2><p>La ubicación determina qué tiendas y precios se muestran en el comparador.</p><CitySettings/></section></main><Footer/></>; }
