const userRepository = require("../models/userRepository");
const bcrypt = require("bcryptjs");
const { getRecommendationsForUser } = require("../models/recommendationService");
const { getOlfactoryNotes, getProductById } = require("../models/catalogRepository");

async function setCity(req, res, next) {
  try {
    const { name, country, lat, lon } = req.body;
    if (!name || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Se requiere name, lat y lon de la ciudad." });
    }

    const city = { name, country: country || "", lat: Number(lat), lon: Number(lon) };
    const user = await userRepository.updateCity(req.userId, city);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    res.json({ user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "El nombre debe tener entre 2 y 80 caracteres." });
    }

    const user = await userRepository.updateName(req.userId, name);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    res.json({ user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Debes indicar tu contraseña actual y la nueva contraseña." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres." });
    }

    const user = await userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    if (!user.passwordHash) {
      return res.status(400).json({ error: "Esta cuenta usa acceso con Google. Gestiona la contraseña desde Google." });
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: "La contraseña actual no es correcta." });
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({ error: "La nueva contraseña debe ser diferente de la actual." });
    }

    await userRepository.updatePassword(user.id, await bcrypt.hash(newPassword, 10));
    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    if (req.body?.confirmation !== "ELIMINAR MI CUENTA") {
      return res.status(400).json({ error: "Escribe ELIMINAR MI CUENTA para confirmar la eliminación." });
    }

    const deleted = await userRepository.deleteById(req.userId);
    if (!deleted) return res.status(404).json({ error: "Usuario no encontrado." });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getFavorites(req, res, next) {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ error: "Se requiere productId." });
    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: "El perfume ya no existe en el catálogo actual." });

    const user = await userRepository.toggleFavorite(req.userId, product.id, product.aliases || []);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    res.json({ user: userRepository.toPublic(user), favorites: user.favorites });
  } catch (err) {
    next(err);
  }
}

async function saveScentQuiz(req, res, next) {
  try {
    const { scores } = req.body;
    if (!scores || typeof scores !== "object") {
      return res.status(400).json({ error: "Se requieren las puntuaciones del test (scores)." });
    }

    const normalized = {};
    const notes = await getOlfactoryNotes();
    const validNoteIds = new Set(notes.map((note) => note.id));
    for (const [noteId, value] of Object.entries(scores)) {
      const num = Number(value);
      if (validNoteIds.has(noteId) && Number.isFinite(num) && num >= 1 && num <= 5) {
        normalized[noteId] = num;
      }
    }

    if (!Object.keys(normalized).length) {
      return res.status(400).json({ error: "Debes calificar al menos una nota olfativa." });
    }

    const user = await userRepository.saveScentPreferences(req.userId, normalized);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const { recommendations } = await getRecommendationsForUser(user);
    res.json({
      user: userRepository.toPublic(user),
      recommendations,
    });
  } catch (err) {
    next(err);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const result = await getRecommendationsForUser(user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, changePassword, deleteAccount, setCity, getFavorites, toggleFavorite, saveScentQuiz, getRecommendations };
