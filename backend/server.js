const path = require("path");
const express = require("express");
const db = require("./db");
const auth = require("./auth");

const app = express();
// Usar 3001 por defecto para evitar colisiones con otros proyectos en la máquina.
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Sirve el front estático (index.html, script.js, estilos, etc.)
app.use(express.static(path.join(__dirname, "..")));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await auth.register(username, password);
    return res.json({ user });
  } catch (e) {
    const msg = e && e.message ? e.message : "Error al registrar";
    return res.status(400).json({ error: msg });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await auth.login(username, password);
    const token = auth.signToken(user);
    return res.json({ token, user });
  } catch (e) {
    const msg = e && e.message ? e.message : "Error al iniciar sesión";
    return res.status(400).json({ error: msg });
  }
});

app.get("/api/me", auth.requireAuth, async (req, res) => {
  const row = db
    .prepare(`SELECT id, username FROM users WHERE id = ?`)
    .get(req.userId);
  if (!row) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json({ user: row });
});

function getDefaults() {
  return {
    xp: 0,
    health: 100,
    gold: 50,
    currentWeaponIndex: 0,
    inventory: ["palo"],
    location: "town",
    wonDragon: 0,
    gameOver: 0,
  };
}

app.get("/api/progress", auth.requireAuth, async (req, res) => {
  const p = db
    .prepare(`SELECT * FROM progress WHERE user_id = ?`)
    .get(req.userId);

  if (!p) {
    const d = getDefaults();
    db.prepare(
      `INSERT INTO progress
       (user_id, xp, health, gold, current_weapon_index, inventory_json, location, won_dragon, game_over)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.userId,
      d.xp,
      d.health,
      d.gold,
      d.currentWeaponIndex,
      JSON.stringify(d.inventory),
      d.location,
      d.wonDragon,
      d.gameOver
    );

    return res.json({ progress: d });
  }

  return res.json({
    progress: {
      xp: p.xp,
      health: p.health,
      gold: p.gold,
      currentWeaponIndex: p.current_weapon_index,
      inventory: JSON.parse(p.inventory_json || "[]"),
      location: p.location,
      wonDragon: !!p.won_dragon,
      gameOver: !!p.game_over,
    },
  });
});

app.put("/api/progress", auth.requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const defaults = getDefaults();

    const inventory = Array.isArray(body.inventory) ? body.inventory : defaults.inventory;

    const xp = Number.isFinite(body.xp) ? body.xp : defaults.xp;
    const health = Number.isFinite(body.health) ? body.health : defaults.health;
    const gold = Number.isFinite(body.gold) ? body.gold : defaults.gold;
    const currentWeaponIndex =
      Number.isFinite(body.currentWeaponIndex) ? body.currentWeaponIndex : defaults.currentWeaponIndex;

    const location = typeof body.location === "string" ? body.location : defaults.location;
    const wonDragon = body.wonDragon ? 1 : 0;
    const gameOver = body.gameOver ? 1 : 0;

    db.prepare(
      `INSERT INTO progress
       (user_id, xp, health, gold, current_weapon_index, inventory_json, location, won_dragon, game_over)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         xp = excluded.xp,
         health = excluded.health,
         gold = excluded.gold,
         current_weapon_index = excluded.current_weapon_index,
         inventory_json = excluded.inventory_json,
         location = excluded.location,
         won_dragon = excluded.won_dragon,
         game_over = excluded.game_over,
         updated_at = datetime('now')`
    ).run(
      req.userId,
      xp,
      health,
      gold,
      currentWeaponIndex,
      JSON.stringify(inventory),
      location,
      wonDragon,
      gameOver
    );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: "No se pudo guardar el progreso" });
  }
});

app.post("/api/progress/reset", auth.requireAuth, async (req, res) => {
  const d = getDefaults();
  db.prepare(
    `INSERT INTO progress
      (user_id, xp, health, gold, current_weapon_index, inventory_json, location, won_dragon, game_over)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        xp = excluded.xp,
        health = excluded.health,
        gold = excluded.gold,
        current_weapon_index = excluded.current_weapon_index,
        inventory_json = excluded.inventory_json,
        location = excluded.location,
        won_dragon = excluded.won_dragon,
        game_over = excluded.game_over,
        updated_at = datetime('now')`
  ).run(
    req.userId,
    d.xp,
    d.health,
    d.gold,
    d.currentWeaponIndex,
    JSON.stringify(d.inventory),
    d.location,
    d.wonDragon,
    d.gameOver
  );

  return res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor activo en http://localhost:${PORT}`);
});

