'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a clean, typed API to the renderer — no raw ipcRenderer access
contextBridge.exposeInMainWorld('api', {

  // ── Projects ──────────────────────────────
  projects: {
    list:   ()           => ipcRenderer.invoke('projects:list'),
    create: (name, lot)  => ipcRenderer.invoke('projects:create', { name, lot }),
    open:   (id)         => ipcRenderer.invoke('projects:open',   { id }),
    delete: (id)         => ipcRenderer.invoke('projects:delete', { id }),
    rename: (id, name, lot) => ipcRenderer.invoke('projects:rename', { id, name, lot }),
  },

  // ── Data ──────────────────────────────────
  data: {
    get:   ()               => ipcRenderer.invoke('data:get'),
    patch: (table, payload) => ipcRenderer.invoke('data:patch', { table, payload }),
  },

  // ── Budget ────────────────────────────────
  budget: {
    add:    (row) => ipcRenderer.invoke('budget:add',    row),
    update: (row) => ipcRenderer.invoke('budget:update', row),
    delete: (id)  => ipcRenderer.invoke('budget:delete', { id }),
  },

  // ── Change Requests ───────────────────────
  cr: {
    add:    (row) => ipcRenderer.invoke('cr:add',    row),
    update: (row) => ipcRenderer.invoke('cr:update', row),
    delete: (id)  => ipcRenderer.invoke('cr:delete', { id }),
  },

  // ── Étapes ────────────────────────────────
  etapes: {
    add:    (row) => ipcRenderer.invoke('etapes:add',    row),
    update: (row) => ipcRenderer.invoke('etapes:update', row),
    delete: (id)  => ipcRenderer.invoke('etapes:delete', { id }),
  },

  // ── Risques ───────────────────────────────
  risques: {
    add:    (row) => ipcRenderer.invoke('risques:add',    row),
    update: (row) => ipcRenderer.invoke('risques:update', row),
    delete: (id)  => ipcRenderer.invoke('risques:delete', { id }),
  },

  // ── Meta ──────────────────────────────────
  meta: {
    update: (obj) => ipcRenderer.invoke('meta:update', obj),
  },

  // ── Utils ─────────────────────────────────
  shell: {
    openDataFolder: () => ipcRenderer.invoke('shell:openDataFolder'),
  }
});
