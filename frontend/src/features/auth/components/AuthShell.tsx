import { AuthPanel } from "./AuthPanel";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/auth.module.css";

// Lo que da una cuenta, dicho en concreto: es la razón para crearla.
const BENEFITS = [
  { icon: "heart" as const, title: "Favoritos guardados", text: "Vuelve a tus perfumes y revisa si bajaron de precio." },
  { icon: "flower" as const, title: "Test olfativo", text: "Cuéntanos qué notas te gustan en un par de minutos." },
  { icon: "compass" as const, title: "Recomendaciones", text: "Perfumes elegidos según tu perfil olfativo." },
];

export function AuthShell({ mode }: { mode: "register" | "login" }) {
  return (
    <>
      <Header />
      <main className={`container ${styles.grid}`}>
        <section className={styles.pitch}>
          <h1>{mode === "register" ? "Crea tu cuenta y guarda tus perfumes." : "Vuelve a tus perfumes guardados."}</h1>
          <p className={styles.lead}>
            Comparar precios no requiere cuenta. Con una, FullFragance recuerda lo que te gusta.
          </p>
          <ul className={styles.benefits}>
            {BENEFITS.map(benefit => (
              <li key={benefit.title}>
                <span className={styles.benefitIcon}><Icon name={benefit.icon} size={20} /></span>
                <span>
                  <strong>{benefit.title}</strong>
                  {benefit.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <AuthPanel mode={mode} />
      </main>
      <Footer />
    </>
  );
}
