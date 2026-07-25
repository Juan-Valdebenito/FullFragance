import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Política de datos | FullFragrance",
  description: "Cómo FullFragrance recopila, usa y protege los datos cuando se crean cuentas.",
};

export default function DataPolicyPage() {
  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Legal</p>
        <h1>Política de datos y privacidad</h1>
        <p>Esta política describe qué datos tratamos cuando usas la web y, en especial, qué información guardamos si decides crear una cuenta para usar favoritos, ubicación y recomendaciones.</p>
        <div className={styles.meta}><span>Última actualización: julio 2026</span><span>Aplica a cuentas, favoritos y test olfativo</span></div>
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>1. Datos que podemos recopilar</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña cifrada cuando te registras.</li>
            <li><strong>Datos de uso:</strong> ciudad seleccionada, favoritos guardados y preferencias olfativas del test.</li>
            <li><strong>Datos técnicos:</strong> información mínima de navegación necesaria para hacer funcionar la sesión, depurar errores y proteger el servicio.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>2. Para qué usamos esos datos</h2>
          <ul>
            <li>Crear y autenticar cuentas.</li>
            <li>Guardar favoritos, personalizar recomendaciones y mostrar precios según tu ciudad.</li>
            <li>Atender soporte, corregir datos y prevenir abuso o accesos no autorizados.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>3. Dónde se almacenan</h2>
          <p>Los datos de cuenta y preferencias se guardan en el backend de la plataforma. El token de sesión se conserva en el navegador del usuario mediante almacenamiento local para mantener la sesión iniciada hasta que la cierres manualmente.</p>
        </article>

        <article className={styles.section}>
          <h2>4. Conservación y seguridad</h2>
          <ul>
            <li>La contraseña se almacena cifrada; no conservamos la contraseña en texto plano.</li>
            <li>Los datos se mantienen mientras la cuenta esté activa o mientras sean necesarios para operar la plataforma.</li>
            <li>Aplicamos medidas razonables para proteger la información, aunque ningún sistema conectado a internet es totalmente infalible.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>5. Tus opciones</h2>
          <ul>
            <li>Puedes revisar y actualizar tu ciudad, favoritos y preferencias desde tu perfil.</li>
            <li>Puedes cerrar sesión eliminando el token guardado en tu dispositivo.</li>
            <li>Puedes pedir corrección o eliminación de tus datos escribiendo a <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link>.</li>
          </ul>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>6. Contacto</h2>
          <div className={styles.contact}>
            <p>Si tienes dudas sobre el tratamiento de datos, escríbenos a:</p>
            <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link>
            <Link href="mailto:contacto@fullfragrance.cl">contacto@fullfragrance.cl</Link>
          </div>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}