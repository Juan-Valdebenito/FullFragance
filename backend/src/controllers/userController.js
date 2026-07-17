const userRepository = require("../models/userRepository");

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

module.exports = { setCity };
