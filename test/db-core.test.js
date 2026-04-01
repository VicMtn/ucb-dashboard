'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  LATEST_SCHEMA_VERSION,
  openDb,
  seedDb,
  upsertTable,
} = require('../src/main/db-core');

function withTempDb(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'peg2bul-test-'));
  const dbPath = path.join(dir, 'project.db');
  let db;
  try {
    db = openDb(dbPath);
    fn(db);
  } finally {
    if (db) db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('openDb applique les migrations et la version de schema', () => {
  withTempDb((db) => {
    const row = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
    assert.equal(row.version, LATEST_SCHEMA_VERSION);

    const budgetTable = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='budget'"
    ).get();
    assert.equal(budgetTable.name, 'budget');
  });
});

test('seedDb initialise les donnees minimales', () => {
  withTempDb((db) => {
    seedDb(db, 'Projet Test');

    const nom = db.prepare("SELECT value FROM meta WHERE key='nom'").get();
    const statut = db.prepare("SELECT value FROM meta WHERE key='statut'").get();
    const kpiDocs = db.prepare("SELECT value FROM kpi WHERE key='docs'").get();

    assert.equal(nom.value, 'Projet Test');
    assert.equal(statut.value, 'En cours');
    assert.equal(kpiDocs.value, '0');
  });
});

test('upsertTable refuse les tables non autorisees', () => {
  withTempDb((db) => {
    assert.throws(
      () => upsertTable(db, 'budget', { a: 1 }),
      /Table non autorisée/
    );
  });
});
