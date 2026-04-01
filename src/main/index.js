'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const {
  fullSnapshot: getFullSnapshot,
  openDb: openDbCore,
  seedDb,
  upsertTable: upsertDbTable,
} = require('./db-core');

const isDev = process.argv.includes('--dev');

// ─────────────────────────────────────────────
// USER DATA DIR  →  where all .db files live
// ─────────────────────────────────────────────
const USER_DATA  = app.getPath('userData');
const PROJECTS_DIR = path.join(USER_DATA, 'projects');
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// Registry: maps projectId → { name, dbPath, createdAt }
const REGISTRY_FILE = path.join(USER_DATA, 'projects.json');
const REGISTRY_REQUIRED_FIELDS = ['id', 'name', 'dbPath', 'createdAt'];
function readRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    if (!Array.isArray(parsed)) {
      console.error('[registry] Format invalide: tableau attendu');
      return [];
    }
    const valid = parsed.filter(entry => {
      if (!entry || typeof entry !== 'object') return false;
      return REGISTRY_REQUIRED_FIELDS.every(f => typeof entry[f] === 'string');
    });
    if (valid.length !== parsed.length) {
      console.error(`[registry] ${parsed.length - valid.length} entrées invalides ignorées`);
    }
    return valid;
  } catch (error) {
    console.error('[registry] Impossible de lire projects.json', error);
    return [];
  }
}
function writeRegistry(list) {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// ─────────────────────────────────────────────
// SQLITE  (one DB instance per project)
// ─────────────────────────────────────────────
let activeDb = null;   // current open DB
let activeId = null;   // current project id

function openDb(dbPath) {
  if (activeDb) { try { activeDb.close(); } catch {} }
  const db = openDbCore(dbPath);
  activeDb = db;
  return db;
}

function withProjectDb(handler) {
  return (event, payload) => {
    if (!activeDb || !activeId) throw new Error('Aucun projet actif. Ouvrez un projet.');
    return handler(event, payload);
  };
}

function handleIpc(channel, handler) {
  ipcMain.handle(channel, async (event, payload) => {
    try {
      return await handler(event, payload);
    } catch (error) {
      console.error(`[ipc:${channel}]`, error);
      throw (error instanceof Error) ? error : new Error('Erreur interne');
    }
  });
}

// ─────────────────────────────────────────────
// IPC HANDLERS
// ─────────────────────────────────────────────

// Projects
handleIpc('projects:list', () => readRegistry());

handleIpc('projects:create', (_, { name, lot }) => {
  if (!name || typeof name !== 'string') throw new Error('Nom de projet invalide');
  const id = `proj_${Date.now()}`;
  const dbPath = path.join(PROJECTS_DIR, `${id}.db`);
  const db = openDb(dbPath);
  seedDb(db, name);
  activeDb.prepare(`INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)`).run('nom', name);
  activeDb.prepare(`INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)`).run('lot', lot || '');
  activeId = id;
  const entry = { id, name, lot: lot || '', dbPath, createdAt: new Date().toISOString() };
  const list = readRegistry();
  list.push(entry);
  writeRegistry(list);
  return entry;
});

handleIpc('projects:open', (_, { id }) => {
  const list = readRegistry();
  const entry = list.find(p => p.id === id);
  if (!entry) throw new Error('Projet introuvable');
  openDb(entry.dbPath);
  activeId = id;
  return { ...entry, data: getFullSnapshot(activeDb) };
});

handleIpc('projects:delete', (_, { id }) => {
  let list = readRegistry();
  const entry = list.find(p => p.id === id);
  if (!entry) return;
  if (activeId === id) {
    try { activeDb.close(); } catch {}
    activeDb = null; activeId = null;
  }
  try { fs.unlinkSync(entry.dbPath); } catch {}
  list = list.filter(p => p.id !== id);
  writeRegistry(list);
  return { ok: true };
});

handleIpc('projects:rename', (_, { id, name, lot }) => {
  if (!name || typeof name !== 'string') throw new Error('Nom de projet invalide');
  const list = readRegistry();
  const entry = list.find(p => p.id === id);
  if (!entry) return;
  entry.name = name;
  entry.lot  = lot;
  writeRegistry(list);
  if (activeId === id) {
    activeDb.prepare(`INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)`).run('nom', name);
    activeDb.prepare(`INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)`).run('lot', lot);
  }
  return { ok: true };
});

// Data
handleIpc('data:get', withProjectDb(() => getFullSnapshot(activeDb)));
handleIpc('data:patch', withProjectDb((_, { table, payload }) => { upsertDbTable(activeDb, table, payload); return { ok: true }; }));

// Budget CRUD
handleIpc('budget:add', withProjectDb((_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM budget`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO budget(categorie,budget_reel,utilise,position) VALUES(?,?,?,?)`).run(r.categorie, r.budget_reel??0, r.utilise??0, pos);
  return activeDb.prepare(`SELECT * FROM budget WHERE id=?`).get(info.lastInsertRowid);
}));
handleIpc('budget:update', withProjectDb((_, r) => {
  activeDb.prepare(`UPDATE budget SET categorie=?,budget_reel=?,utilise=? WHERE id=?`).run(r.categorie, r.budget_reel, r.utilise, r.id);
  return { ok: true };
}));
handleIpc('budget:delete', withProjectDb((_, { id }) => {
  activeDb.prepare(`DELETE FROM budget WHERE id=?`).run(id);
  return { ok: true };
}));

// CR CRUD
handleIpc('cr:add', withProjectDb((_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM change_requests`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO change_requests(ref,statut,description,position) VALUES(?,?,?,?)`).run(r.ref, r.statut??'ouvert', r.description??'', pos);
  return activeDb.prepare(`SELECT * FROM change_requests WHERE id=?`).get(info.lastInsertRowid);
}));
handleIpc('cr:update', withProjectDb((_, r) => {
  activeDb.prepare(`UPDATE change_requests SET ref=?,statut=?,description=? WHERE id=?`).run(r.ref, r.statut, r.description, r.id);
  return { ok: true };
}));
handleIpc('cr:delete', withProjectDb((_, { id }) => {
  activeDb.prepare(`DELETE FROM change_requests WHERE id=?`).run(id);
  return { ok: true };
}));

// Étapes CRUD
handleIpc('etapes:add', withProjectDb((_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM etapes`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO etapes(titre,date_label,description,priorite,position) VALUES(?,?,?,?,?)`).run(r.titre, r.date_label??'', r.description??'', r.priorite??'dark', pos);
  return activeDb.prepare(`SELECT * FROM etapes WHERE id=?`).get(info.lastInsertRowid);
}));
handleIpc('etapes:update', withProjectDb((_, r) => {
  activeDb.prepare(`UPDATE etapes SET titre=?,date_label=?,description=?,priorite=? WHERE id=?`).run(r.titre, r.date_label, r.description, r.priorite, r.id);
  return { ok: true };
}));
handleIpc('etapes:delete', withProjectDb((_, { id }) => {
  activeDb.prepare(`DELETE FROM etapes WHERE id=?`).run(id);
  return { ok: true };
}));

// Risques CRUD
handleIpc('risques:add', withProjectDb((_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM risques`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO risques(risque,domaine,impact,position) VALUES(?,?,?,?)`).run(r.risque, r.domaine??'Technique', r.impact??'', pos);
  return activeDb.prepare(`SELECT * FROM risques WHERE id=?`).get(info.lastInsertRowid);
}));
handleIpc('risques:update', withProjectDb((_, r) => {
  activeDb.prepare(`UPDATE risques SET risque=?,domaine=?,impact=? WHERE id=?`).run(r.risque, r.domaine, r.impact, r.id);
  return { ok: true };
}));
handleIpc('risques:delete', withProjectDb((_, { id }) => {
  activeDb.prepare(`DELETE FROM risques WHERE id=?`).run(id);
  return { ok: true };
}));

// Meta
handleIpc('meta:update', withProjectDb((_, obj) => { upsertDbTable(activeDb, 'meta', obj); return { ok: true }; }));

// Utils
handleIpc('shell:openDataFolder', () => shell.openPath(USER_DATA));

// ─────────────────────────────────────────────
// WINDOW
// ─────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'PEG2BUL Dashboard',
    backgroundColor: '#f8f9fa',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  if (isDev) mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (activeDb) try { activeDb.close(); } catch {}
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
