const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  // "sub" = subject (id del usuario)
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.username = decoded.username;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

async function register(username, password) {
  const clean = String(username || "").trim();
  if (clean.length < 3) {
    const err = new Error("El usuario debe tener al menos 3 caracteres.");
    err.code = "BAD_USERNAME";
    throw err;
  }
  if (String(password || "").length < 6) {
    const err = new Error("La contraseña debe tener al menos 6 caracteres.");
    err.code = "BAD_PASSWORD";
    throw err;
  }

  const password_hash = await bcrypt.hash(String(password), 12);

  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash)
    VALUES (?, ?)
  `);
  try {
    const info = stmt.run(clean, password_hash);
    return { id: info.lastInsertRowid, username: clean };
  } catch (e) {
    // SQLite: constraint failed (UNIQUE)
    const err = new Error("Ese usuario ya existe.");
    err.code = "DUP_USERNAME";
    throw err;
  }
}

async function login(username, password) {
  const clean = String(username || "").trim();
  const row = db
    .prepare(`SELECT id, username, password_hash FROM users WHERE username = ?`)
    .get(clean);

  if (!row) {
    const err = new Error("Credenciales inválidas.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  const ok = await bcrypt.compare(String(password), row.password_hash);
  if (!ok) {
    const err = new Error("Credenciales inválidas.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  return { id: row.id, username: row.username };
}

module.exports = {
  requireAuth,
  signToken,
  register,
  login,
};

