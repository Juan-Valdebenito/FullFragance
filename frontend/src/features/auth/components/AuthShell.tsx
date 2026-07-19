import { AuthPanel } from "./AuthPanel";
import { Brand } from "@/shared/components/Brand";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/auth.module.css";
export function AuthShell({ mode }: { mode: "register" | "login" }) { return <div className={styles.shell}><header className={`container ${styles.header}`}><Brand/><div className={styles.location}><Icon name="pin"/> Santiago, CL</div></header><main className={styles.main}><div className={`container ${styles.grid}`}><section className={styles.pitch}><p className="eyebrow">Perfumería inteligente</p><h1 className="display">Encuentra la esencia<br/>de tu <span>próximo lujo.</span></h1><p className={styles.lead}>Compara precios de perfumes en tiendas de tu ciudad y descubre fragancias según tus gustos.</p><div className={styles.benefits}><span><Icon name="chart"/> Comparador en tiempo real</span><span><Icon name="compass"/> Descubrimiento guiado</span></div></section><AuthPanel mode={mode}/></div></main><Footer compact/></div>; }
