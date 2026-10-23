const { execFile } = require("child_process");
const { promisify } = require("util");
const { ripleyUserAgent, ripleyRequestTimeoutMs } = require("../config/env");

const execFileAsync = promisify(execFile);
const IMAGE_HOSTS = new Set(["rimage.ripley.cl", "home.ripley.cl"]);
let activeDownloads = 0;

function safeImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname) || url.port || url.username || url.password) return null;
    if (!url.pathname.startsWith("/home.ripley/Attachment/") && !url.pathname.startsWith("/store/Attachment/")) return null;
    return url.href;
  } catch { return null; }
}

async function ripleyImage(req, res, next) {
  try {
    const rawUrl = req.query.url;
    const { sku } = req.params;
    const targetUrls = [];

    if (rawUrl) {
      const safeUrl = safeImageUrl(rawUrl);
      if (safeUrl) targetUrls.push(safeUrl);
    }

    if (sku && /^[a-zA-Z0-9_-]{4,30}$/.test(sku)) {
      const cleanSku = sku.replace(/P$/i, "");
      targetUrls.push(
        `https://rimage.ripley.cl/home.ripley/Attachment/WOP/1/${cleanSku}/full_image-${cleanSku}`,
        `https://rimage.ripley.cl/home.ripley/Attachment/WOP/1/${cleanSku}/full_image-${cleanSku}.webp`,
        `https://home.ripley.cl/store/Attachment/WOP/D327/${cleanSku}/${cleanSku}_2.jpg`,
        `https://home.ripley.cl/store/Attachment/WOP/D328/${cleanSku}/${cleanSku}_2.jpg`
      );
    }

    if (!targetUrls.length) {
      return res.status(400).json({ error: "Se requiere un SKU o una URL de imagen de Ripley válida." });
    }
    if (activeDownloads >= 4) {
      res.set("Retry-After", "5");
      return res.status(503).json({ error: "Servicio de imágenes ocupado. Reintenta en unos segundos." });
    }

    let stdoutBuffer = null;
    let contentType = "image/jpeg";

    for (const targetUrl of targetUrls) {
      activeDownloads += 1;
      try {
        const { stdout } = await execFileAsync("curl", [
          "--disable",
          "--fail",
          "--proto", "=https",
          "--max-filesize", "5242880",
          "--connect-timeout", "5",
          "--compressed",
          "--silent",
          "--show-error",
          "--max-time",
          String(Math.ceil(ripleyRequestTimeoutMs / 1000)),
          "--user-agent",
          ripleyUserAgent,
          "--header",
          "Referer: https://simple.ripley.cl/",
          targetUrl,
        ], { encoding: "buffer", maxBuffer: 5 * 1024 * 1024, timeout: ripleyRequestTimeoutMs + 1000 });

        const jpeg = stdout?.[0] === 0xff && stdout?.[1] === 0xd8 && stdout?.[2] === 0xff;
        const png = stdout?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const webp = stdout?.subarray(0, 4).toString() === "RIFF" && stdout?.subarray(8, 12).toString() === "WEBP";
        if (jpeg || png || webp) {
          stdoutBuffer = stdout;
          contentType = webp ? "image/webp" : png ? "image/png" : "image/jpeg";
          break;
        }
      } catch {
        // Probar siguiente URL candidata
      } finally {
        activeDownloads -= 1;
      }
    }

    if (!stdoutBuffer) {
      return res.status(404).json({ error: "Imagen Ripley no disponible." });
    }

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    });
    res.send(stdoutBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = { ripleyImage, safeImageUrl };
