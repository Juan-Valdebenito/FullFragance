import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Política de uso | FullFragrance",
  description: "Condiciones de uso y alcance de la plataforma FullFragrance.",
};

export default function UsePolicyPage() {
  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Legal</p>
        <h1>Política de uso de la web</h1>
        <p>FullFragrance es una herramienta informativa para comparar perfumes y precios publicados por tiendas. Estas condiciones explican qué hacemos, qué no hacemos y las reglas para utilizar la plataforma de forma segura.</p>
        <div className={styles.meta}><span>Versión 1.0 · 30 de julio de 2026</span><span>Aplica a visitantes y cuentas registradas</span></div>
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>1. Aceptación y naturaleza del servicio</h2>
          <p>Al navegar, crear una cuenta o usar cualquier función de FullFragrance aceptas estas condiciones y nuestra <Link href="/politica-de-datos">Política de datos y privacidad</Link>. La plataforma compara información de perfumes y precios para apoyar una decisión de compra; no es una tienda, no vende productos, no procesa pagos y no actúa como representante de los comercios mostrados, salvo que se indique expresamente.</p>
        </article>

        <article className={styles.section}>
          <h2>2. Precios, stock y decisiones de compra</h2>
          <ul>
            <li>Los precios, disponibilidad, promociones, imágenes y descripciones pueden cambiar sin aviso por decisión de cada tienda.</li>
            <li>La información mostrada es referencial y puede contener retrasos, errores de captura o diferencias por sucursal, ciudad, despacho, medios de pago o condiciones de una promoción.</li>
            <li>Antes de comprar, debes confirmar el precio final, stock, costos de envío, condiciones de venta, garantía y características directamente en el sitio o canal oficial de la tienda.</li>
            <li>La decisión de compra y cualquier contrato celebrado con una tienda son exclusivamente entre la persona compradora y esa tienda.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>3. Enlaces, marcas y contenido de terceros</h2>
          <p>Podemos incluir enlaces a sitios de terceros para facilitar la consulta de una oferta. Al salir de FullFragrance se aplican las condiciones, privacidad y prácticas del sitio de destino. Las marcas, nombres comerciales, imágenes y contenidos de tiendas pertenecen a sus respectivos titulares; su presencia sirve para identificar y comparar productos y no implica patrocinio, afiliación, aprobación o relación comercial con FullFragrance.</p>
        </article>

        <article className={styles.section}>
          <h2>4. Uso permitido</h2>
          <ul>
            <li>Usar la web para comparar perfumes, explorar precios, guardar favoritos y recibir recomendaciones personales.</li>
            <li>Crear una cuenta con información correcta y mantener protegidas tus credenciales.</li>
            <li>Usar los resultados como apoyo informativo, respetando los derechos de FullFragrance, de las tiendas y de otros usuarios.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>5. Uso no permitido</h2>
          <ul>
            <li>Extraer, copiar, indexar o recolectar datos de forma automatizada, masiva o que afecte la disponibilidad del servicio, salvo autorización previa y escrita.</li>
            <li>Intentar vulnerar accesos, eludir medidas de seguridad, introducir código malicioso, suplantar identidades o interferir con el funcionamiento del sitio.</li>
            <li>Usar el contenido para engañar, infringir derechos de terceros, realizar actividades ilícitas o presentar los datos de la plataforma como propios sin autorización.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>6. Cuentas y medidas ante abuso</h2>
          <p>Eres responsable de la actividad realizada con tu cuenta y de mantener en reserva tu contraseña. Si detectamos actividad razonablemente sospechosa, fraudulenta, perjudicial o contraria a estas condiciones, podremos limitar, suspender o cerrar el acceso de forma proporcional, y adoptar las medidas necesarias para resguardar la seguridad del servicio y de sus usuarios.</p>
        </article>

        <article className={styles.section}>
          <h2>7. Disponibilidad, cambios y responsabilidad</h2>
          <p>Podemos actualizar, corregir, limitar o retirar funciones, fuentes de información y contenidos cuando sea necesario para operar, mejorar o proteger la plataforma. Procuramos que la información sea útil y actual, pero no garantizamos que el servicio esté disponible sin interrupciones ni que los datos de terceros sean completos o estén libres de errores.</p>
          <p>En la máxima medida permitida por la ley, FullFragrance no responde por pérdidas derivadas de decisiones tomadas exclusivamente con base en información referencial de la plataforma o por la relación entre el usuario y una tienda externa. Esta regla no limita derechos irrenunciables ni responsabilidades que la ley prohíba excluir.</p>
        </article>

        <article className={styles.section}>
          <h2>8. Ley aplicable y vigencia</h2>
          <p>Estas condiciones se rigen por las leyes de Chile, sin perjuicio de las normas imperativas de protección al consumidor u otras que resulten aplicables. Podemos modificarlas por cambios operativos, técnicos o legales; la versión vigente se publicará en esta página con su fecha de actualización.</p>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>9. Contacto</h2>
          <div className={styles.contact}>
            <p>Para consultas sobre estas condiciones, errores de información o solicitudes de corrección, contáctanos en:</p>
            <Link href="mailto:contacto@fullfragrance.cl">contacto@fullfragrance.cl</Link>
            <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link>
          </div>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}
