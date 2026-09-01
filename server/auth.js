const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY =
  process.env.JWT_SECRET ||
  process.env.SECRET_KEY ||
  "cargo-invoice-secret-key-change-in-production-9f8e7d6c5b4a";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days session

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hashed) {
  try {
    if (!plain || !hashed) return false;
    return bcrypt.compareSync(plain, hashed);
  } catch (err) {
    return false;
  }
}

function createToken(username) {
  const sub = typeof username === "object" && username !== null ? username.sub || username.username : username;
  const payload = {
    sub: String(sub),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  return jwt.sign(payload, SECRET_KEY, { algorithm: "HS256" });
}

function decodeToken(token) {
  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] });
    return payload.sub;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const error = new Error("Session expired. Please log in again.");
      error.statusCode = 401;
      throw error;
    }
    const error = new Error("Invalid session token.");
    error.statusCode = 401;
    throw error;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Missing or malformed authorization header." });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = decodeToken(token);
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({ detail: err.message });
  }
}

module.exports = {
  SECRET_KEY,
  hashPassword,
  verifyPassword,
  createToken,
  createAccessToken: createToken,
  decodeToken,
  authMiddleware,
};
