const { execFile } = require("child_process");
const { promisify } = require("util");
const { ripleyUserAgent, ripleyRequestTimeoutMs } = require("../config/env");

const execFileAsync = promisify(execFile);

async function ripleyImage(req, res, next) {
  try {
    const rawUrl = req.query.url;
    const { sku } = req.params;
    const targetUrls = [];

    if (rawUrl) {
      const decoded = String(rawUrl);
      try {
        const parsed = new URL(decoded);
        if (/(^|\.)ripley\.(cl|com)$/i.test(parsed.hostname)) {
          targetUrls.push(parsed.toString());
        }
      } catch {
        // Si no es URL válida, ignorar query param
      }
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

    let stdoutBuffer = null;
    let contentType = "image/jpeg";

    for (const targetUrl of targetUrls) {
      try {
        const { stdout } = await execFileAsync("curl", [
          "--fail",
          "--location",
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
        ], { encoding: "buffer", maxBuffer: 12 * 1024 * 1024 });

        if (stdout && stdout.length > 0) {
          stdoutBuffer = stdout;
          if (targetUrl.endsWith(".webp") || targetUrl.includes("full_image-")) {
            contentType = "image/webp";
          } else if (targetUrl.endsWith(".png")) {
            contentType = "image/png";
          }
          break;
        }
      } catch {
        // Probar siguiente URL candidata
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

module.exports = { ripleyImage };
