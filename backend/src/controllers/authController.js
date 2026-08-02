const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const userRepository = require("../models/userRepository");
const { signToken } = require("../utils/jwt");
const { googleClientId } = require("../config/env");
const { isPlainObject, normalizedEmail, normalizedName, validPassword } = require("../utils/validation");

const googleClient = new OAuth2Client();

async function register(req, res, next) {
  try {
    if (!isPlainObject(req.body)) return res.status(400).json({ error: "El cuerpo de la solicitud no es válido." });
    const name = normalizedName(req.body.name);
    const email = normalizedEmail(req.body.email);
    const password = req.body.password;
    if (!name || !email || !validPassword(password)) {
      return res.status(400).json({ error: "Indica nombre, correo válido y una contraseña de 10 a 128 caracteres que incluya letras y números." });
    }
    if (await userRepository.findByEmail(email)) return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });

    const user = await userRepository.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: signToken({ sub: user.id, sv: user.sessionVersion }), user: userRepository.toPublic(user) });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    if (!isPlainObject(req.body)) return res.status(400).json({ error: "El cuerpo de la solicitud no es válido." });
    const email = normalizedEmail(req.body.email);
    const password = req.body.password;
    if (!email || typeof password !== "string" || password.length > 128) return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }
    res.json({ token: signToken({ sub: user.id, sv: user.sessionVersion }), user: userRepository.toPublic(user) });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ user: userRepository.toPublic(user) });
  } catch (err) { next(err); }
}

async function googleAuth(req, res, next) {
  try {
    const idToken = isPlainObject(req.body) ? (req.body.credential || req.body.idToken) : null;
    if (!googleClientId) return res.status(503).json({ error: "El acceso con Google no está configurado en el servidor." });
    if (!idToken || typeof idToken !== "string") return res.status(400).json({ error: "No se recibió una credencial válida de Google." });

    // El navegador no es una fuente confiable: sólo usamos datos firmados por Google.
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      return res.status(401).json({ error: "Google no entregó un correo verificado para esta cuenta." });
    }

    const email = payload.email.trim().toLowerCase();
    const user = await userRepository.findOrCreateGoogleUser({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      picture: payload.picture || null,
    });
    res.json({ token: signToken({ sub: user.id, sv: user.sessionVersion }), user: userRepository.toPublic(user) });
  } catch (err) {
    if (err.message?.includes("Token used too late") || err.message?.includes("Wrong recipient") || err.message?.includes("Invalid token")) {
      return res.status(401).json({ error: "La credencial de Google no es válida o ya expiró." });
    }
    next(err);
  }
}

module.exports = { register, login, me, googleAuth };
