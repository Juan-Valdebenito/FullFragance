const bcrypt = require("bcryptjs");
const userRepository = require("../models/userRepository");
const { signToken } = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }
    if (await userRepository.findByEmail(email)) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ name, email, passwordHash });
    const token = signToken({ sub: user.id });

    res.status(201).json({ token, user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const token = signToken({ sub: user.id });
    res.json({ token, user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { credential, idToken, email: directEmail, name: directName, googleId: directGoogleId, picture: directPicture } = req.body;
    let email = directEmail;
    let name = directName;
    let googleId = directGoogleId;
    let picture = directPicture;

    const token = credential || idToken;
    if (token && typeof token === "string") {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            googleId = payload.sub || googleId;
            picture = payload.picture || picture;
          }
        }
      } catch (err) {
        console.warn("No se pudo decodificar el token de Google:", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: "No se pudo obtener el correo electrónico desde la autenticación de Google." });
    }

    const user = await userRepository.findOrCreateGoogleUser({
      name: name || email.split("@")[0],
      email,
      googleId,
      picture,
    });

    const jwtToken = signToken({ sub: user.id });
    res.json({ token: jwtToken, user: userRepository.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, googleAuth };
