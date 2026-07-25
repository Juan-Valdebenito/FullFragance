import type { Metadata } from "next";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Política de uso | FullFragrance",
  description: "Reglas de uso, responsabilidades y condiciones generales de la plataforma FullFragrance.",
};

export default function UsePolicyPage() {
  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Legal</p>
        <h1>Política de uso de la web</h1>
        <p>Estas reglas explican cómo se puede usar FullFragrance, qué esperamos de cada persona que entra a la plataforma y qué límites aplican al comparar perfumes y crear cuentas.</p>
        <div className={styles.meta}><span>Última actualización: julio 2026</span><span>Aplica a visitantes y cuentas registradas</span></div>
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>1. Aceptación</h2>
          <p>Al navegar, crear una cuenta o usar cualquier función de FullFragrance aceptas esta política. Si no estás de acuerdo con alguno de estos puntos, debes dejar de usar la plataforma.</p>
        </article>

        <article className={styles.section}>
          <h2>2. Uso permitido</h2>
          <ul>
            <li>Usar la web para comparar perfumes, revisar precios, guardar favoritos y recibir recomendaciones personales.</li>
            <li>Crear una cuenta con datos reales y mantener la seguridad de tu contraseña y sesión.</li>
            <li>Compartir información con soporte solo cuando necesites ayuda o corrección de datos.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>3. Uso no permitido</h2>
          <ul>
            <li>Intentar extraer datos de forma automatizada, abusiva o que degrade el servicio.</li>
            <li>Interferir con la operación del sitio, vulnerar accesos, probar código malicioso o eludir medidas de seguridad.</li>
            <li>Usar la información para fines ilícitos, engañosos o para presentar precios y contenidos como propios sin autorización.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>4. Cuentas y responsabilidades</h2>
          <ul>
            <li>Si creas una cuenta, eres responsable de la exactitud del nombre y correo que ingreses.</li>
            <li>Debes proteger tus credenciales y cerrar sesión en dispositivos compartidos.</li>
            <li>FullFragrance puede suspender accesos que muestren actividad sospechosa, abuso del sistema o incumplimiento de esta política.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>5. Contenido de terceros</h2>
          <p>La plataforma muestra información de tiendas y catálogos externos. Aunque intentamos mantenerla actualizada, no garantizamos que todo precio, stock, descripción o imagen esté siempre vigente en el momento de la consulta.</p>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>6. Cambios y contacto</h2>
          <p>Podemos actualizar esta política cuando cambie la plataforma o la normativa aplicable. Si tienes dudas sobre su alcance, escríbenos a contacto@fullfragrance.cl.</p>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}