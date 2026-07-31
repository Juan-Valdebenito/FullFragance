import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Política de datos y privacidad | FullFragrance",
  description: "Información clara sobre el tratamiento de datos personales en FullFragrance.",
};

export default function DataPolicyPage() {
  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Legal</p>
        <h1>Política de datos y privacidad</h1>
        <p>En esta política explicamos, en lenguaje claro, qué datos usa FullFragrance, para qué los necesita y cómo puedes ejercer control sobre ellos. No vendemos tus datos personales ni los usamos para fines ajenos a los descritos aquí.</p>
        <div className={styles.meta}><span>Versión 1.0 · 30 de julio de 2026</span><span>Aplica a visitantes y cuentas registradas</span></div>
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>1. Responsable y alcance</h2>
          <p>FullFragrance es responsable del tratamiento de los datos personales que recopila directamente a través de esta plataforma. Para consultas, solicitudes de privacidad o reclamos, puedes escribir a <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link>. Esta política cubre la navegación, las cuentas, favoritos, ciudad y preferencias del test olfativo.</p>
        </article>

        <article className={styles.section}>
          <h2>2. Datos que tratamos</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y una contraseña protegida mediante un hash; no guardamos contraseñas en texto plano.</li>
            <li><strong>Datos de Google, si eliges ese acceso:</strong> nombre, correo electrónico verificado, identificador de Google y, cuando esté disponible, imagen de perfil.</li>
            <li><strong>Preferencias que eliges guardar:</strong> ciudad, perfumes favoritos y respuestas o puntajes del test olfativo.</li>
            <li><strong>Datos técnicos y métricas agregadas:</strong> token de sesión, registros necesarios para seguridad, prevención de abuso, diagnóstico de errores y conteos de páginas consultadas. Estas métricas no se vinculan a un perfil publicitario y respetan la señal “Do Not Track” del navegador.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>3. Finalidades y fundamento del tratamiento</h2>
          <ul>
            <li>Crear y administrar tu cuenta, autenticar tu acceso y proteger la plataforma.</li>
            <li>Guardar tus favoritos, ciudad y preferencias para entregarte funciones personalizadas que solicitas.</li>
            <li>Responder consultas, atender solicitudes sobre tus datos y detectar usos fraudulentos o contrarios a la seguridad.</li>
            <li>Entender de forma agregada qué secciones de la plataforma son más consultadas para mejorar el servicio.</li>
            <li>Cumplir obligaciones legales y ejercer o defender derechos cuando corresponda.</li>
          </ul>
          <p>Cuando una función requiera tu decisión, como crear una cuenta, iniciar sesión con Google o guardar preferencias, el tratamiento se realiza para prestar esa función y conforme a la autorización que entregas al usarla. Puedes dejar de usar funciones opcionales o pedir la eliminación de los datos asociados.</p>
        </article>

        <article className={styles.section}>
          <h2>4. Almacenamiento, seguridad y sesión</h2>
          <ul>
            <li>Los datos de cuenta y preferencias se almacenan en la infraestructura de la plataforma.</li>
            <li>La sesión se mantiene mediante un token guardado en el almacenamiento local de tu navegador; puedes eliminarlo al cerrar sesión o borrar los datos del sitio en tu dispositivo.</li>
            <li>Aplicamos medidas técnicas y organizativas razonables, incluyendo protección de credenciales y controles de acceso. Ningún sistema conectado a internet puede garantizar seguridad absoluta.</li>
          </ul>
        </article>

        <article className={styles.section}>
          <h2>5. Comunicaciones y terceros</h2>
          <p>No vendemos ni arrendamos datos personales. Solo podemos comunicar datos cuando sea necesario para operar la plataforma, usar proveedores tecnológicos bajo instrucciones de confidencialidad, atender una solicitud tuya, cumplir una obligación legal o proteger la seguridad y derechos de FullFragrance o de terceros. Si inicias sesión con Google, también aplican las condiciones y políticas de ese proveedor.</p>
          <p>La información de productos, tiendas y precios se usa para comparación. No compartimos tus datos de cuenta con las tiendas para realizar compras, porque FullFragrance no procesa pagos ni vende productos en su nombre.</p>
        </article>

        <article className={styles.section}>
          <h2>6. Conservación</h2>
          <p>Conservamos los datos mientras tu cuenta esté activa o sean necesarios para las finalidades informadas, seguridad, resolución de controversias y cumplimiento de obligaciones aplicables. Al solicitar la eliminación, borraremos o anonimizaremos los datos que ya no necesitemos, salvo que una norma o la defensa de un derecho exija conservarlos por más tiempo.</p>
        </article>

        <article className={styles.section}>
          <h2>7. Tus derechos y cómo ejercerlos</h2>
          <p>Puedes solicitar acceso, rectificación, eliminación, oposición o bloqueo de datos, y los demás derechos que reconozca la normativa aplicable, incluida la portabilidad cuando corresponda. Envía tu solicitud a <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link> indicando tu nombre, correo de la cuenta, petición concreta y un medio para responderte. Podremos pedir información razonable para verificar tu identidad y proteger tu cuenta.</p>
          <p>Esta política se interpreta de acuerdo con la Ley N.º 19.628 y sus modificaciones, además de las demás normas chilenas aplicables en materia de datos personales.</p>
        </article>

        <article className={styles.section}>
          <h2>8. Menores de edad</h2>
          <p>La plataforma no está diseñada para recopilar deliberadamente datos de niños, niñas o adolescentes sin la intervención que exija la ley. Si crees que un menor entregó datos personales sin la autorización correspondiente, escríbenos para revisarlo y, si procede, eliminarlos.</p>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>9. Cambios y contacto</h2>
          <div className={styles.contact}>
            <p>Podemos actualizar esta política si cambian nuestras funciones o la normativa. Publicaremos la versión y fecha de actualización en esta página.</p>
            <Link href="mailto:datos@fullfragrance.cl">datos@fullfragrance.cl</Link>
            <Link href="mailto:contacto@fullfragrance.cl">contacto@fullfragrance.cl</Link>
          </div>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}
