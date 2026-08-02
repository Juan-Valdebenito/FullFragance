const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function normalizedName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 && !/[\u0000-\u001F\u007F]/.test(name) ? name : null;
}

function validPassword(value) {
  return typeof value === "string"
    && value.length >= 10
    && value.length <= 128
    && /[a-záéíóúñ]/i.test(value)
    && /\d/.test(value);
}

module.exports = { isPlainObject, normalizedEmail, normalizedName, validPassword };
