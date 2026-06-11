let xp = 0;
let health = 100;
let gold = 50;
let currentWeaponIndex = 0;
let fighting;
let monsterHealth;
let inventory = ["palo"];
const FLEE_SUCCESS_CHANCE = 0.4;

// Estado persistente del jugador (se guarda en BD)
let currentLocationKey = "town";
let wonDragon = false;
let gameOver = false;

// Auth (JWT)
let authToken = localStorage.getItem("rpg_token") || null;
let saveTimeoutId = null;

// Modal functions
function mostrarMensaje(texto) {
  const modal = document.getElementById("modalMensaje");
  const textoEl = document.getElementById("textoMensaje");
  if (modal && textoEl) {
    textoEl.textContent = texto;
    modal.style.display = "flex";
  }
}

function cerrarModal() {
  const modal = document.getElementById("modalMensaje");
  if (modal) {
    modal.style.display = "none";
  }
}

const button1 = document.querySelector("#button1");
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");

const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterName = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");

// Auth UI
const authEl = document.querySelector("#auth");
const gameEl = document.querySelector("#game");
const authMessageEl = document.querySelector("#authMessage");
const loginUsernameEl = document.querySelector("#loginUsername");
const loginPasswordEl = document.querySelector("#loginPassword");
const loginBtn = document.querySelector("#loginBtn");
const registerUsernameEl = document.querySelector("#registerUsername");
const registerPasswordEl = document.querySelector("#registerPassword");
const registerBtn = document.querySelector("#registerBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const syncStatusEl = document.querySelector("#syncStatus");

const weapons = [
  { name: "Palo", damage: 5, price: 0 },
  { name: "Daga", damage: 30, price: 220 },
  { name: "Martillo de Garra", damage: 50, price: 240 },
  { name: "Espada de fuego", damage: 100, price: 890 }
];

const monsters = [
  { name: "Bestia con colmillos", health: 60, level: 4 },
  { name: "Caminante blanco", health: 100, level: 8 },
  { name: "Dragón", health: 500, level: 20 }
];

const locations = [
  {
    key: "town",
    name: "town square",
    "button text": ["Ir a la tienda", "Ir a la cueva", "Luchar contra el dragón"],
    "button functions": [goStore, goCave, fightDragon],
    text: "Estás en la plaza del pueblo. Ves un cartel que dice \"Tienda\"."
  },
  {
    key: "store",
    name: "store",
    "button text": ["Comprar 10 de salud (10 de oro)", "Comprar un arma (30 de oro)", "Ir a la plaza del pueblo"],
    "button functions": [buyHealth, buyWeapon, goTown],
    text: "Entras en la tienda."
  },
  {
    key: "cave",
    name: "cave",
    "button text": ["Luchar contra la bestia con colmillos", "Luchar contra el caminante blanco", "Ir a la plaza del pueblo"],
    "button functions": [fightBeast, fightCaminante, goTown],
    text: "Entras en la cueva. Ves algunos monstruos."
  }
];

// Se inicializa la UI del juego al autenticar/cargar progreso.

function update(location) {
  currentLocationKey = location.key || "town";
  if (currentLocationKey === "store") {
    setSceneBackground("store");
  } else if (currentLocationKey === "cave") {
    setSceneBackground("cave");
  } else {
    setSceneBackground("town");
  }

  button1.innerText = location["button text"][0];
  button2.innerText = location["button text"][1];
  button3.innerText = location["button text"][2];
  // Si veníamos de una pantalla final, aseguramos que los botones vuelvan a mostrarse.
  button2.style.display = "";
  button3.style.display = "";

  button1.onclick = location["button functions"][0];
  button2.onclick = location["button functions"][1];
  button3.onclick = location["button functions"][2];

  text.innerText = location.text;
  monsterStats.style.display = "none";
}

function goTown() {
  if (wonDragon || gameOver) return;
  update(locations[0]);
  scheduleSave();
}

function goStore() {
  if (wonDragon || gameOver) return;
  update(locations[1]);
  scheduleSave();
}

function goCave() {
  if (wonDragon || gameOver) return;
  update(locations[2]);
  scheduleSave();
}

function buyHealth() {
  if (wonDragon || gameOver) return;
  if (gold >= 10) {
    gold -= 10;
    health += 10;
    goldText.innerText = gold;
    healthText.innerText = health;
    scheduleSave();
  } else {
    mostrarMensaje("No tienes suficiente oro para comprar salud.");
  }
}

function buyWeapon() {
  if (wonDragon || gameOver) return;
  if (currentWeaponIndex < weapons.length - 1) {
    if (gold >= 30) {
      gold -= 30;
      currentWeaponIndex++;
      const newWeapon = weapons[currentWeaponIndex];
      text.innerText = "Ahora tienes un " + newWeapon.name + ".";
      inventory.push(newWeapon.name);
      text.innerText += " En tu inventario tienes: " + inventory.join(", ");
      goldText.innerText = gold;
      scheduleSave();
    } else {
      mostrarMensaje("No tienes suficiente oro para comprar un arma.");
    }
  } else {
    mostrarMensaje("Ya tienes el arma más poderosa!");
  }
}

function fightBeast() {
  fightMonster(0);
}

function fightCaminante() {
  fightMonster(1);
}

function fightDragon() {
  fightMonster(2);
}

function fightMonster(index) {
  fighting = index;
  monsterHealth = monsters[index].health;
  if (index === 0) {
    setSceneBackground("beast");
  } else if (index === 1) {
    setSceneBackground("walker");
  } else {
    setSceneBackground("dragon");
  }

  monsterStats.style.display = "block";
  monsterName.innerText = monsters[index].name;
  monsterHealthText.innerText = monsterHealth;
  text.innerText = `¡Te enfrentas a ${monsters[index].name}!`;

  button1.innerText = "Atacar";
  button2.innerText = "Esquivar";
  button3.innerText = "Huir";

  button1.onclick = attack;
  button2.onclick = dodge;
  button3.onclick = flee;
}

function attack() {
  if (wonDragon || gameOver) return;
  const weapon = weapons[currentWeaponIndex];
  const monster = monsters[fighting];
  const damage = weapon.damage + Math.floor(Math.random() * xp);
  monsterHealth -= damage;
  monsterHealthText.innerText = monsterHealth;
  text.innerText = `Usaste tu ${weapon.name} e hiciste ${damage} de daño a ${monster.name}.`;

  if (monsterHealth > 0) {
    health -= monster.level * 10;
    healthText.innerText = health;
    text.innerText += `\n${monster.name} te golpeó. Pierdes ${monster.level * 10} de salud.`;

    if (health <= 0) {
      lose();
    }
  } else {
    defeatMonster();
  }

  scheduleSave();
}

function dodge() {
  if (wonDragon || gameOver) return;
  const chance = Math.random();
  if (chance < 0.5) {
    text.innerText = "Lograste esquivar el ataque del monstruo.";
  } else {
    health -= monsters[fighting].level * 10;
    healthText.innerText = health;
    text.innerText = "Fallaste el esquive y recibiste daño.";
    if (health <= 0) {
      lose();
    }
  }

  scheduleSave();
}

function flee() {
  if (wonDragon || gameOver || fighting === undefined) return;

  const escaped = Math.random() < FLEE_SUCCESS_CHANCE;
  if (escaped) {
    text.innerText = "Conseguiste huir del combate.";
    monsterStats.style.display = "none";
    update(locations[0]);
  } else {
    const monster = monsters[fighting];
    const damage = Math.max(1, Math.floor(monster.level * 5));
    health -= damage;
    healthText.innerText = health;
    text.innerText = `No pudiste huir. ${monster.name} te golpeó por ${damage}.`;
    if (health <= 0) {
      lose();
    }
  }

  scheduleSave();
}

function defeatMonster() {
  const monster = monsters[fighting];
  xp += monster.level * 10;
  gold += monster.level * 20;
  xpText.innerText = xp;
  goldText.innerText = gold;

  if (monster.name === "Dragón") {
    wonDragon = true;
    gameOver = false;
    text.innerText = `¡Has derrotado al Dragón! ¡El pueblo está a salvo! ¡Felicidades, héroe! 🎉`;
    button1.innerText = "Jugar de nuevo";
    button2.style.display = "none";
    button3.style.display = "none";
    button1.onclick = resetGame;
    monsterStats.style.display = "none";
  } else {
    text.innerText = `Derrotaste a ${monster.name}. Ganaste ${monster.level * 10} XP y ${monster.level * 20} de oro.`;
    monsterStats.style.display = "none";
    update(locations[0]);
  }
}

function lose() {
  wonDragon = false;
  gameOver = true;
  text.innerText = "¡Has muerto! El dragón sigue reinando. GAME OVER.";
  button1.innerText = "Reiniciar";
  button2.style.display = "none";
  button3.style.display = "none";
  button1.onclick = resetGame;
  monsterStats.style.display = "none";
}

// --- Persistencia (BD) / Auth ---
const API_BASE = "/api";
const SCENE_BACKGROUNDS = {
  town: "/assets/town.png",
  store: "/assets/store.png",
  cave: "/assets/cave.png",
  beast: "/assets/beast.png",
  walker: "/assets/walker.png",
  dragon: "/assets/dragon.png",
};

function setSceneBackground(sceneKey) {
  const sceneUrl = SCENE_BACKGROUNDS[sceneKey] || "";
  if (sceneUrl) {
    document.body.style.backgroundImage = `url("${sceneUrl}")`;
  } else {
    document.body.style.backgroundImage = "";
  }
}

function locationByKey(key) {
  return locations.find((l) => l.key === key) || locations[0];
}

function showAuth() {
  if (authEl) authEl.style.display = "block";
  if (gameEl) gameEl.style.display = "none";
  setSceneBackground("town");
}

function showGame() {
  if (authEl) authEl.style.display = "none";
  if (gameEl) gameEl.style.display = "flex";
}

function logout() {
  authToken = null;
  localStorage.removeItem("rpg_token");
  // DO NOT clear local progress here - keep it for next session to sync
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = null;
  }

  if (loginPasswordEl) loginPasswordEl.value = "";
  if (registerPasswordEl) registerPasswordEl.value = "";
  setAuthMessage("Sesión cerrada. Inicia con otra cuenta.");
  showAuth();
}

function setAuthMessage(message, isError = false) {
  if (!authMessageEl) return;
  authMessageEl.innerText = message || "";
  authMessageEl.style.color = isError ? "#ff8080" : "#ffd76f";
}

function showSyncStatus(message, isWarn = false) {
  if (!syncStatusEl) return;
  syncStatusEl.innerText = message || "";
  syncStatusEl.style.color = isWarn ? "#ff8080" : "#88ff88";
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data;
}

function buildProgressPayload() {
  return {
    xp,
    health,
    gold,
    currentWeaponIndex,
    inventory,
    location: currentLocationKey,
    wonDragon,
    gameOver,
  };
}

// --- Local persistence helpers (autosave when no auth) ---
const LOCAL_PROGRESS_KEY = "rpg_local_progress";

function saveLocalProgress() {
  try {
    const payload = buildProgressPayload();
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore quota errors
  }
}

function loadLocalProgress() {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearLocalProgress() {
  try {
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
  } catch (e) {}
}

async function syncLocalToServer() {
  const raw = loadLocalProgress();
  if (!raw) {
    return true; // Nothing to sync, considered success
  }
  if (!authToken) {
    return false; // Cannot sync without token
  }

  try {
    // Upload local progress to server
    await apiFetch("/progress", {
      method: "PUT",
      body: JSON.stringify(raw),
    });
    // Success - clear local copy IMMEDIATELY so loadProgress() doesn't use stale local data
    clearLocalProgress();
    showSyncStatus("Progreso local sincronizado con el servidor.");
    console.log("[syncLocalToServer] Success, local progress cleared");
    return true;
  } catch (e) {
    // If sync fails, keep local copy and try later.
    console.warn("syncLocalToServer failed", e && e.message ? e.message : e);
    showSyncStatus("No se pudo sincronizar. Se intentará más tarde.", true);
    return false;
  }
}

function renderFromState() {
  xpText.innerText = xp;
  healthText.innerText = health;
  goldText.innerText = gold;

  monsterStats.style.display = "none";
  monsterHealth = undefined;
  fighting = undefined;

  if (wonDragon) {
    setSceneBackground("town");
    text.innerText = `¡Has derrotado al Dragón! ¡El pueblo está a salvo! ¡Felicidades, héroe! 🎉`;
    button1.innerText = "Jugar de nuevo";
    button2.style.display = "none";
    button3.style.display = "none";
    button1.onclick = resetGame;
    return;
  }

  if (gameOver) {
    setSceneBackground("town");
    text.innerText = "¡Has muerto! El dragón sigue reinando. GAME OVER.";
    button1.innerText = "Reiniciar";
    button2.style.display = "none";
    button3.style.display = "none";
    button1.onclick = resetGame;
    return;
  }

  update(locationByKey(currentLocationKey));
}

function applyProgress(progress) {
  xp = Number.isFinite(progress.xp) ? progress.xp : 0;
  health = Number.isFinite(progress.health) ? progress.health : 100;
  gold = Number.isFinite(progress.gold) ? progress.gold : 50;
  currentWeaponIndex = Number.isFinite(progress.currentWeaponIndex) ? progress.currentWeaponIndex : 0;
  inventory = Array.isArray(progress.inventory) ? progress.inventory : ["palo"];
  currentLocationKey = typeof progress.location === "string" ? progress.location : "town";
  wonDragon = !!progress.wonDragon;
  gameOver = !!progress.gameOver;

  renderFromState();
}

async function loadProgress() {
  // PRIORITY: If there's unsync'd local progress, use it (it's more recent)
  const local = loadLocalProgress();
  if (local) {
    console.log("[loadProgress] Using local unsync'd progress", local);
    applyProgress(local);
    return;
  }
  
  // Otherwise load from server
  try {
    const data = await apiFetch("/progress", { method: "GET" });
    console.log("[loadProgress] Loaded from server", data.progress);
    applyProgress(data.progress);
  } catch (e) {
    console.warn("[loadProgress] Failed to load from server, using defaults", e);
    // If server load fails, use hardcoded defaults
    applyProgress({
      xp: 0, health: 100, gold: 50, currentWeaponIndex: 0,
      inventory: ["palo"], location: "town", wonDragon: false, gameOver: false
    });
  }
}

function scheduleSave() {
  // Always persist locally first so progress isn't lost.
  saveLocalProgress();

  if (!authToken) return;

  if (saveTimeoutId) clearTimeout(saveTimeoutId);
  saveTimeoutId = setTimeout(() => {
    saveTimeoutId = null;
    saveProgress().catch(() => {
      // If server save fails (token expired etc), keep local copy.
    });
  }, 400);
}

async function saveProgress() {
  if (!authToken) return;
  await apiFetch("/progress", {
    method: "PUT",
    body: JSON.stringify(buildProgressPayload()),
  });
}

async function resetGame() {
  wonDragon = false;
  gameOver = false;
  xp = 0;
  health = 100;
  gold = 50;
  currentWeaponIndex = 0;
  inventory = ["palo"];
  fighting = undefined;
  monsterHealth = undefined;
  currentLocationKey = "town";

  // Intentamos resetear también en la BD (best effort).
  try {
    await apiFetch("/progress/reset", { method: "POST" });
  } catch {
    // Ignorar si falla por ejemplo por token inválido.
  }

  renderFromState();
}

loginBtn.addEventListener("click", async () => {
  try {
    setAuthMessage("");
    const username = loginUsernameEl.value;
    const password = loginPasswordEl.value;

    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    authToken = data.token;
    localStorage.setItem("rpg_token", authToken);
    setAuthMessage("Sesión iniciada correctamente.");
    showGame();
    // Try to sync any local progress saved while unauthenticated,
    // then load server progress (which now has the synced data or original server state).
    try {
      await syncLocalToServer();
    } catch (e) {
      console.warn("Sync failed on login, proceeding to load from server", e);
    }
    await loadProgress();
  } catch (e) {
    setAuthMessage(e && e.message ? e.message : "No se pudo iniciar sesión.", true);
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    setAuthMessage("");
    const username = registerUsernameEl.value;
    const password = registerPasswordEl.value;

    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    // Tras registrarse, iniciamos sesión.
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    authToken = data.token;
    localStorage.setItem("rpg_token", authToken);
    setAuthMessage("Cuenta creada. Bienvenido.");
    showGame();
    // If the user had local progress, sync it to the server first.
    try {
      await syncLocalToServer();
    } catch (e) {
      console.warn("Sync failed on register, proceeding to load from server", e);
    }
    await loadProgress();
  } catch (e) {
    setAuthMessage(e && e.message ? e.message : "No se pudo registrar.", true);
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Arranque
if (authToken) {
  showGame();
  // IMPORTANT: Sync FIRST (send local progress to server), THEN load
  (async () => {
    try {
      const syncSuccess = await syncLocalToServer();
      console.log("[startup] Sync result:", syncSuccess);
    } catch (e) {
      console.warn("[startup] Sync failed", e);
    }
    try {
      await loadProgress();
    } catch (e) {
      // Token inválido/expirado
      authToken = null;
      localStorage.removeItem("rpg_token");
      setAuthMessage(e && e.message ? e.message : "Sesión expirada, inicia sesión de nuevo.", true);
      showAuth();
    }
  })();
} else {
  showAuth();
}

// On load, if there's local progress and no auth, inform the user.
(() => {
  const local = loadLocalProgress();
  if (local && !authToken) {
    showSyncStatus("Progreso guardado localmente. Inicia sesión para sincronizar.", true);
  } else if (local && authToken) {
    // If local progress exists and we're authenticated, try to sync.
    syncLocalToServer().catch(() => {
      showSyncStatus("No se pudo sincronizar automáticamente.", true);
    });
  }
})();
