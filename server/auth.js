const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY = process.env.SECRET_KEY || "change-this-secret-in-production-9f8e7d6c5b4a";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hour session

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hashed) {
  try {
    return bcrypt.compareSync(plain, hashed);
  } catch (err) {
    return false;
  }
}

function createToken(username) {
  const payload = {
    sub: username,
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
  decodeToken,
  authMiddleware,
};
