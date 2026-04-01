'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

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
// SHIM  node:sqlite  →  better-sqlite3-compatible API
//
// node:sqlite stmt.all() returns { columns: string[], rows: unknown[][] }
// We reshape to [{ col: val, ... }] to match better-sqlite3's row objects.
// ─────────────────────────────────────────────
const { DatabaseSync } = require('node:sqlite');

class DB {
  constructor(dbPath) {
    this._db = new DatabaseSync(dbPath);
    this._db.exec('PRAGMA journal_mode = WAL');
    this._db.exec('PRAGMA foreign_keys = ON');
  }

  // Returns a statement-like object with .all(), .get(), .run()
  prepare(sql) {
    const raw = this._db.prepare(sql);

    // node:sqlite return format varies by Electron/Node version:
    //   Format A: plain array of objects  [{ col: val }, ...]  (newer default)
    //   Format B: { columns: string[], rows: unknown[][] }     (expanded / older)
    const normalize = (result) => {
      if (!result) return [];
      if (Array.isArray(result)) return result;                   // Format A
      if (result.columns && Array.isArray(result.rows)) {        // Format B
        return result.rows.map(row =>
          Object.fromEntries(result.columns.map((c, i) => [c, row[i]]))
        );
      }
      return [];
    };

    return {
      all: (...params) => normalize(raw.all(...params)),
      get: (...params) => { const r = normalize(raw.all(...params)); return r[0] ?? undefined; },
      run: (...params) => raw.run(...params),  // → { lastInsertRowid, changes }
    };
  }

  exec(sql)   { this._db.exec(sql); }

  // Minimal transaction shim — executes fn synchronously inside BEGIN/COMMIT
  transaction(fn) {
    return (...args) => {
      this._db.exec('BEGIN');
      try {
        const result = fn(...args);
        this._db.exec('COMMIT');
        return result;
      } catch (e) {
        this._db.exec('ROLLBACK');
        throw e;
      }
    };
  }

  close() { this._db.close(); }
}

// ─────────────────────────────────────────────
// SQLITE  (one DB instance per project)
// ─────────────────────────────────────────────
let activeDb = null;   // current open DB
let activeId = null;   // current project id
const SIMPLE_KEY_VALUE_TABLES = new Set(['kpi', 'avancement', 'technique', 'documentation', 'meta']);

function openDb(dbPath) {
  if (activeDb) { try { activeDb.close(); } catch {} }
  const db = new DB(dbPath);
  initSchema(db);
  activeDb = db;
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kpi (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS avancement (key TEXT PRIMARY KEY, value REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS technique (key TEXT PRIMARY KEY, value REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS documentation (key TEXT PRIMARY KEY, value REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categorie TEXT NOT NULL, budget_reel REAL NOT NULL DEFAULT 0,
      utilise REAL NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'ouvert',
      description TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS etapes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL, date_label TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '', priorite TEXT NOT NULL DEFAULT 'dark',
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS risques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risque TEXT NOT NULL, domaine TEXT NOT NULL DEFAULT 'Technique',
      impact TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
}

function seedDb(db, projectName) {
  const upsertKpi  = db.prepare(`INSERT OR IGNORE INTO kpi(key,value) VALUES(?,?)`);
  const upsertAv   = db.prepare(`INSERT OR IGNORE INTO avancement(key,value) VALUES(?,?)`);
  const upsertTech = db.prepare(`INSERT OR IGNORE INTO technique(key,value) VALUES(?,?)`);
  const upsertDoc  = db.prepare(`INSERT OR IGNORE INTO documentation(key,value) VALUES(?,?)`);
  const upsertMeta = db.prepare(`INSERT OR IGNORE INTO meta(key,value) VALUES(?,?)`);

  db.transaction(() => {
    for (const [k,v] of Object.entries({ docs:'0', docsRef:'', io:'0', ioDelta:'0', fs:'0', fsInit:'0', jalPaid:'0', jalTotal:'0' }))
      upsertKpi.run(k, v);
    for (const [k,v] of Object.entries({ finance:0, doc:0, auto:0 }))
      upsertAv.run(k, v);
    for (const [k,v] of Object.entries({ prog:0, sup:0, batch:0, batchProg:0, batchTotal:0, batchPrete:0 }))
      upsertTech.run(k, v);
    for (const [k,v] of Object.entries({ appro:0, revue:0, attente:0, nouvelles:0 }))
      upsertDoc.run(k, v);
    upsertMeta.run('statut', 'En cours');
    upsertMeta.run('nom', projectName);
    upsertMeta.run('lot', '');
  })();
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function tableToObj(table) {
  if (!SIMPLE_KEY_VALUE_TABLES.has(table)) throw new Error(`Table non autorisée: ${table}`);
  if (!activeDb) throw new Error('Aucun projet actif');
  return Object.fromEntries(
    activeDb.prepare(`SELECT key,value FROM ${table}`).all().map(r => [r.key, r.value])
  );
}
function upsertTable(table, obj) {
  const stmt = activeDb.prepare(
    `INSERT INTO ${table}(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  );
  activeDb.transaction(() => {
    for (const [k,v] of Object.entries(obj)) stmt.run(k, String(v));
  })();
}
function fullSnapshot() {
  return {
    kpi:           tableToObj('kpi'),
    avancement:    tableToObj('avancement'),
    technique:     tableToObj('technique'),
    documentation: tableToObj('documentation'),
    budget:        activeDb.prepare(`SELECT * FROM budget ORDER BY position`).all(),
    cr:            activeDb.prepare(`SELECT * FROM change_requests ORDER BY position`).all(),
    etapes:        activeDb.prepare(`SELECT * FROM etapes ORDER BY position`).all(),
    risques:       activeDb.prepare(`SELECT * FROM risques ORDER BY position`).all(),
    meta:          tableToObj('meta'),
  };
}

// ─────────────────────────────────────────────
// IPC HANDLERS
// ─────────────────────────────────────────────

// Projects
ipcMain.handle('projects:list', () => readRegistry());

ipcMain.handle('projects:create', (_, { name, lot }) => {
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

ipcMain.handle('projects:open', (_, { id }) => {
  const list = readRegistry();
  const entry = list.find(p => p.id === id);
  if (!entry) throw new Error('Projet introuvable');
  openDb(entry.dbPath);
  activeId = id;
  return { ...entry, data: fullSnapshot() };
});

ipcMain.handle('projects:delete', (_, { id }) => {
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

ipcMain.handle('projects:rename', (_, { id, name, lot }) => {
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
ipcMain.handle('data:get',    () => fullSnapshot());
ipcMain.handle('data:patch',  (_, { table, payload }) => { upsertTable(table, payload); return { ok: true }; });

// Budget CRUD
ipcMain.handle('budget:add',    (_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM budget`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO budget(categorie,budget_reel,utilise,position) VALUES(?,?,?,?)`).run(r.categorie, r.budget_reel??0, r.utilise??0, pos);
  return activeDb.prepare(`SELECT * FROM budget WHERE id=?`).get(info.lastInsertRowid);
});
ipcMain.handle('budget:update', (_, r) => {
  activeDb.prepare(`UPDATE budget SET categorie=?,budget_reel=?,utilise=? WHERE id=?`).run(r.categorie, r.budget_reel, r.utilise, r.id);
  return { ok: true };
});
ipcMain.handle('budget:delete', (_, { id }) => {
  activeDb.prepare(`DELETE FROM budget WHERE id=?`).run(id);
  return { ok: true };
});

// CR CRUD
ipcMain.handle('cr:add',    (_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM change_requests`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO change_requests(ref,statut,description,position) VALUES(?,?,?,?)`).run(r.ref, r.statut??'ouvert', r.description??'', pos);
  return activeDb.prepare(`SELECT * FROM change_requests WHERE id=?`).get(info.lastInsertRowid);
});
ipcMain.handle('cr:update', (_, r) => {
  activeDb.prepare(`UPDATE change_requests SET ref=?,statut=?,description=? WHERE id=?`).run(r.ref, r.statut, r.description, r.id);
  return { ok: true };
});
ipcMain.handle('cr:delete', (_, { id }) => {
  activeDb.prepare(`DELETE FROM change_requests WHERE id=?`).run(id);
  return { ok: true };
});

// Étapes CRUD
ipcMain.handle('etapes:add',    (_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM etapes`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO etapes(titre,date_label,description,priorite,position) VALUES(?,?,?,?,?)`).run(r.titre, r.date_label??'', r.description??'', r.priorite??'dark', pos);
  return activeDb.prepare(`SELECT * FROM etapes WHERE id=?`).get(info.lastInsertRowid);
});
ipcMain.handle('etapes:update', (_, r) => {
  activeDb.prepare(`UPDATE etapes SET titre=?,date_label=?,description=?,priorite=? WHERE id=?`).run(r.titre, r.date_label, r.description, r.priorite, r.id);
  return { ok: true };
});
ipcMain.handle('etapes:delete', (_, { id }) => {
  activeDb.prepare(`DELETE FROM etapes WHERE id=?`).run(id);
  return { ok: true };
});

// Risques CRUD
ipcMain.handle('risques:add',    (_, r) => {
  const pos = (activeDb.prepare(`SELECT MAX(position) as m FROM risques`).get().m ?? -1) + 1;
  const info = activeDb.prepare(`INSERT INTO risques(risque,domaine,impact,position) VALUES(?,?,?,?)`).run(r.risque, r.domaine??'Technique', r.impact??'', pos);
  return activeDb.prepare(`SELECT * FROM risques WHERE id=?`).get(info.lastInsertRowid);
});
ipcMain.handle('risques:update', (_, r) => {
  activeDb.prepare(`UPDATE risques SET risque=?,domaine=?,impact=? WHERE id=?`).run(r.risque, r.domaine, r.impact, r.id);
  return { ok: true };
});
ipcMain.handle('risques:delete', (_, { id }) => {
  activeDb.prepare(`DELETE FROM risques WHERE id=?`).run(id);
  return { ok: true };
});

// Meta
ipcMain.handle('meta:update', (_, obj) => { upsertTable('meta', obj); return { ok: true }; });

// Utils
ipcMain.handle('shell:openDataFolder', () => shell.openPath(USER_DATA));

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
