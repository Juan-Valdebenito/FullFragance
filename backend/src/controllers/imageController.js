const { execFile } = require("child_process");
const { promisify } = require("util");
const { ripleyUserAgent, ripleyRequestTimeoutMs } = require("../config/env");

const execFileAsync = promisify(execFile);

async function ripleyImage(req, res, next) {
  try {
    const { sku } = req.params;
    if (!/^\d{8,20}$/.test(sku)) {
      return res.status(400).json({ error: "SKU de imagen Ripley inválido." });
    }
    const url = `https://rimage.ripley.cl/home.ripley/Attachment/WOP/1/${sku}/full_image-${sku}.webp`;
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
      "--referer",
      "https://simple.ripley.cl/",
      url,
    ], { encoding: "buffer", maxBuffer: 12 * 1024 * 1024 });

    res.set({
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    });
    res.send(stdout);
  } catch (error) {
    if (/curl.*22|HTTP.*(?:403|404)/i.test(error.message || "")) {
      return res.status(404).json({ error: "Imagen Ripley no disponible." });
    }
    next(error);
  }
}

module.exports = { ripleyImage };
