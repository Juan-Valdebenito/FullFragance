const reviewRepository = require("../models/reviewRepository");

const NAME_MIN = 2;
const NAME_MAX = 40;
const BODY_MIN = 10;
const BODY_MAX = 600;

// Quita caracteres de control (salvo saltos de línea en el cuerpo) y espacios
// repetidos. El texto se guarda plano: React lo escapa al mostrarlo.
function cleanName(value) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanBody(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validId(value) {
  return /^\d{1,18}$/.test(String(value)) ? String(value) : null;
}

async function listPublic(_req, res, next) {
  try {
    res.set("Cache-Control", "public, max-age=60");
    res.json({ reviews: await reviewRepository.listApproved(30) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    // Campo trampa: invisible para personas, los bots lo rellenan. Se responde
    // igual que un envío válido para no darles pistas, pero no se guarda.
    if (String(req.body?.website ?? "").trim()) {
      return res.status(201).json({ message: "Gracias, tu reseña se publicará tras ser revisada." });
    }
    const name = cleanName(req.body?.name);
    const body = cleanBody(req.body?.body);
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return res.status(400).json({ error: `Tu nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.` });
    }
    if (body.length < BODY_MIN || body.length > BODY_MAX) {
      return res.status(400).json({ error: `La reseña debe tener entre ${BODY_MIN} y ${BODY_MAX} caracteres.` });
    }
    await reviewRepository.create({ name, body });
    res.status(201).json({ message: "Gracias, tu reseña se publicará tras ser revisada." });
  } catch (err) {
    next(err);
  }
}

async function listForAdmin(_req, res, next) {
  try {
    const [pending, approved] = await Promise.all([
      reviewRepository.listPending(),
      reviewRepository.listApproved(100),
    ]);
    res.json({ pending, approved });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const id = validId(req.params.id);
    const review = id && await reviewRepository.approve(id);
    if (!review) return res.status(404).json({ error: "Reseña no encontrada." });
    res.json({ review });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = validId(req.params.id);
    if (!id || !(await reviewRepository.remove(id))) return res.status(404).json({ error: "Reseña no encontrada." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listPublic, create, listForAdmin, approve, remove, cleanName, cleanBody };
