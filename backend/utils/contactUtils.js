function normalizeEmail(email) {
  if (!email) return null;

  const normalized = String(email).trim().toLowerCase();

  return normalized || null;
}

function normalizePhone(phone) {
  if (!phone) return null;

  const normalized = String(phone).replace(/\D/g, "");

  return normalized || null;
}

function isValidEmail(email) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeHeader(header) {
  return String(header)
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

module.exports = {
  normalizeEmail,
  normalizePhone,
  isValidEmail,
  normalizeHeader,
};
