import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Imagen por defecto al compartir cualquier página en redes. Las fichas de
// perfume usan la foto del producto (ver perfumes/[id]/page.tsx).
export const alt = "FullFragance — Comparador de precios de perfumes en Chile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#c9a46a";
const INK = "#141210";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.jpeg"));
  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 90px",
          background: `radial-gradient(circle at 100% 0%, rgba(170, 126, 63, 0.35), transparent 55%), ${INK}`,
          color: "#f4efe6",
        }}
      >
        <img src={logoSrc} width={300} height={300} alt="" style={{ borderRadius: 32 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 34, letterSpacing: 12, color: GOLD }}>FULLFRAGANCE</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.08, maxWidth: 680 }}>
            Compara precios de perfumes en Chile
          </div>
          <div style={{ fontSize: 30, color: "#cfc6b8", maxWidth: 680 }}>
            El mismo perfume en varias tiendas, de más barato a más caro.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
