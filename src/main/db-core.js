'use strict';

const { DatabaseSync } = require('node:sqlite');

const SIMPLE_KEY_VALUE_TABLES = new Set(['kpi', 'avancement', 'technique', 'documentation', 'meta']);
const LATEST_SCHEMA_VERSION = 1;

class DB {
  constructor(dbPath) {
    this._db = new DatabaseSync(dbPath);
    this._db.exec('PRAGMA journal_mode = WAL');
    this._db.exec('PRAGMA foreign_keys = ON');
  }

  prepare(sql) {
    const raw = this._db.prepare(sql);
    const normalize = (result) => {
      if (!result) return [];
      if (Array.isArray(result)) return result;
      if (result.columns && Array.isArray(result.rows)) {
        return result.rows.map(row =>
          Object.fromEntries(result.columns.map((c, i) => [c, row[i]]))
        );
      }
      return [];
    };

    return {
      all: (...params) => normalize(raw.all(...params)),
      get: (...params) => {
        const rows = normalize(raw.all(...params));
        return rows[0] ?? undefined;
      },
      run: (...params) => raw.run(...params),
    };
  }

  exec(sql) { this._db.exec(sql); }

  transaction(fn) {
    return (...args) => {
      this._db.exec('BEGIN');
      try {
        const result = fn(...args);
        this._db.exec('COMMIT');
        return result;
      } catch (error) {
        this._db.exec('ROLLBACK');
        throw error;
      }
    };
  }

  close() { this._db.close(); }
}

const MIGRATIONS = {
  1: (db) => {
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
  },
};

function getSchemaVersion(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
  if (!row) {
    db.prepare('INSERT INTO schema_version(version) VALUES(?)').run(0);
    return 0;
  }
  return Number(row.version) || 0;
}

function setSchemaVersion(db, version) {
  db.exec('DELETE FROM schema_version');
  db.prepare('INSERT INTO schema_version(version) VALUES(?)').run(version);
}

function migrateSchema(db) {
  let version = getSchemaVersion(db);
  while (version < LATEST_SCHEMA_VERSION) {
    const next = version + 1;
    const migration = MIGRATIONS[next];
    if (!migration) throw new Error(`Migration manquante: v${next}`);
    migration(db);
    setSchemaVersion(db, next);
    version = next;
  }
  return version;
}

function openDb(dbPath) {
  const db = new DB(dbPath);
  migrateSchema(db);
  return db;
}

function seedDb(db, projectName) {
  const upsertKpi = db.prepare('INSERT OR IGNORE INTO kpi(key,value) VALUES(?,?)');
  const upsertAv = db.prepare('INSERT OR IGNORE INTO avancement(key,value) VALUES(?,?)');
  const upsertTech = db.prepare('INSERT OR IGNORE INTO technique(key,value) VALUES(?,?)');
  const upsertDoc = db.prepare('INSERT OR IGNORE INTO documentation(key,value) VALUES(?,?)');
  const upsertMeta = db.prepare('INSERT OR IGNORE INTO meta(key,value) VALUES(?,?)');

  db.transaction(() => {
    for (const [k, v] of Object.entries({ docs: '0', docsRef: '', io: '0', ioDelta: '0', fs: '0', fsInit: '0', jalPaid: '0', jalTotal: '0' })) upsertKpi.run(k, v);
    for (const [k, v] of Object.entries({ finance: 0, doc: 0, auto: 0 })) upsertAv.run(k, v);
    for (const [k, v] of Object.entries({ prog: 0, sup: 0, batch: 0, batchProg: 0, batchTotal: 0, batchPrete: 0 })) upsertTech.run(k, v);
    for (const [k, v] of Object.entries({ appro: 0, revue: 0, attente: 0, nouvelles: 0 })) upsertDoc.run(k, v);
    upsertMeta.run('statut', 'En cours');
    upsertMeta.run('nom', projectName);
    upsertMeta.run('lot', '');
  })();
}

function tableToObj(db, table) {
  if (!SIMPLE_KEY_VALUE_TABLES.has(table)) throw new Error(`Table non autorisée: ${table}`);
  return Object.fromEntries(
    db.prepare(`SELECT key,value FROM ${table}`).all().map(r => [r.key, r.value])
  );
}

function upsertTable(db, table, obj) {
  if (!SIMPLE_KEY_VALUE_TABLES.has(table)) throw new Error(`Table non autorisée: ${table}`);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Payload invalide');
  const stmt = db.prepare(
    `INSERT INTO ${table}(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  );
  db.transaction(() => {
    for (const [k, v] of Object.entries(obj)) stmt.run(k, String(v));
  })();
}

function fullSnapshot(db) {
  return {
    kpi: tableToObj(db, 'kpi'),
    avancement: tableToObj(db, 'avancement'),
    technique: tableToObj(db, 'technique'),
    documentation: tableToObj(db, 'documentation'),
    budget: db.prepare('SELECT * FROM budget ORDER BY position').all(),
    cr: db.prepare('SELECT * FROM change_requests ORDER BY position').all(),
    etapes: db.prepare('SELECT * FROM etapes ORDER BY position').all(),
    risques: db.prepare('SELECT * FROM risques ORDER BY position').all(),
    meta: tableToObj(db, 'meta'),
  };
}

module.exports = {
  DB,
  LATEST_SCHEMA_VERSION,
  SIMPLE_KEY_VALUE_TABLES,
  fullSnapshot,
  migrateSchema,
  openDb,
  seedDb,
  upsertTable,
};
