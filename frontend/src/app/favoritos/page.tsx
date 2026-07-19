import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { FavoritesCatalog } from "@/features/catalog/components/FavoritesCatalog";
import styles from "./favorites.module.css";
export const metadata: Metadata = { title: "Mis favoritos | FullFragrance" };
export default function FavoritesPage() { return <><Header active="catalog"/><main className={`container ${styles.main}`}><header><p className="eyebrow">Tu colección personal</p><h1 className="display">Mis favoritos</h1><p>Todos los perfumes que guardaste, con sus precios actualizados para tu ciudad.</p></header><FavoritesCatalog className={styles.grid}/></main><Footer/></>; }
