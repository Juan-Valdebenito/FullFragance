const userRepository = require("../models/userRepository");
const { getRecommendationsForUser } = require("../models/recommendationService");
const { getOlfactoryNotes, getProductById } = require("../models/catalogRepository");

function setCity(req, res, next) {
  try {
    const { name, country, lat, lon } = req.body;
    if (!name || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Se requiere name, lat y lon de la ciudad." });
    }

    const city = { name, country: country || "", lat: Number(lat), lon: Number(lon) };
    const user = userRepository.updateCity(req.userId, city);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    res.json({ user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

function getFavorites(req, res, next) {
  try {
    const user = userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    next(err);
  }
}

function toggleFavorite(req, res, next) {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ error: "Se requiere productId." });
    const product = getProductById(productId);
    if (!product) return res.status(404).json({ error: "El perfume ya no existe en el catálogo actual." });

    const user = userRepository.toggleFavorite(req.userId, product.id, product.aliases || []);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    res.json({ user: userRepository.toPublic(user), favorites: user.favorites });
  } catch (err) {
    next(err);
  }
}

function saveScentQuiz(req, res, next) {
  try {
    const { scores } = req.body;
    if (!scores || typeof scores !== "object") {
      return res.status(400).json({ error: "Se requieren las puntuaciones del test (scores)." });
    }

    const normalized = {};
    const validNoteIds = new Set(getOlfactoryNotes().map((note) => note.id));
    for (const [noteId, value] of Object.entries(scores)) {
      const num = Number(value);
      if (validNoteIds.has(noteId) && Number.isFinite(num) && num >= 1 && num <= 5) {
        normalized[noteId] = num;
      }
    }

    if (!Object.keys(normalized).length) {
      return res.status(400).json({ error: "Debes calificar al menos una nota olfativa." });
    }

    const user = userRepository.saveScentPreferences(req.userId, normalized);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const { recommendations } = getRecommendationsForUser(user);
    res.json({
      user: userRepository.toPublic(user),
      recommendations,
    });
  } catch (err) {
    next(err);
  }
}

function getRecommendations(req, res, next) {
  try {
    const user = userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const result = getRecommendationsForUser(user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { setCity, getFavorites, toggleFavorite, saveScentQuiz, getRecommendations };
