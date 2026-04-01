# PEG2BUL Dashboard

Application desktop de gestion de projets Automation — client lourd Electron + SQLite.

## Stack

| Couche | Technologie |
|--------|------------|
| Desktop shell | Electron 33 (Node 22 embarqué) |
| Persistance | `node:sqlite` natif — zéro dépendance native, zéro compilation |
| IPC | contextBridge (sécurisé, contextIsolation=true) |
| UI | HTML/CSS/JS vanilla (aucun framework) |
| Build | electron-builder (NSIS / DMG / AppImage) |

> **Pourquoi `node:sqlite` ?**  
> `better-sqlite3` nécessite une compilation native (node-gyp) incompatible avec Node 24 / Xcode récent.  
> `node:sqlite` est intégré à Node 22+ — pas de `npm install`, pas de binaires, pas de recompilation.  
> Un shim dans `src/main/index.js` expose la même API (`.prepare().all/get/run`, `.transaction()`).

## Données

Les fichiers `.db` sont stockés dans le dossier **userData** d'Electron :

| OS | Chemin |
|----|--------|
| Windows | `%APPDATA%\peg2bul-dashboard\projects\` |
| macOS | `~/Library/Application Support/peg2bul-dashboard/projects/` |
| Linux | `~/.config/peg2bul-dashboard/projects/` |

Un fichier `projects.json` dans ce même dossier sert de registry (liste des projets connus).

## Installation & démarrage

```bash
npm install
npm start          # lancement dev
npm run dev        # avec --watch (node hot-reload)
```

## Build distributable

```bash
npm run build:win    # → dist/*.exe  (NSIS installer)
npm run build:mac    # → dist/*.dmg
npm run build:linux  # → dist/*.AppImage
```

> **Prérequis build Windows** : les binaires natifs `better-sqlite3` doivent être recompilés pour Electron.
> Ajouter dans `package.json` → `build` :
> ```json
> "npmRebuild": true,
> "nodeGypRebuild": false
> ```
> et lancer `npx electron-rebuild` avant de builder.

## Structure des fichiers

```
peg2bul-electron/
├── package.json
├── src/
│   ├── main/
│   │   └── index.js          ← process principal, IPC handlers, SQLite
│   ├── preload/
│   │   └── index.js          ← bridge sécurisé main ↔ renderer
│   └── renderer/
│       ├── index.html
│       ├── css/app.css
│       └── js/app.js         ← toute la logique UI
└── README.md
```

## Architecture IPC

```
Renderer (window.api.xxx)
    ↕  contextBridge (preload)
Main process (ipcMain.handle)
    ↕
better-sqlite3 (.db fichier)
```

Aucun accès direct à Node depuis le renderer — tout passe par le preload (`contextIsolation: true`).

## Multi-projets

- **Créer** un projet → modal → génère un ID unique (`proj_<timestamp>`), crée le `.db`, seed les tables vides, enregistre dans `projects.json`
- **Ouvrir** → charge le `.db` correspondant, ferme le précédent
- **Renommer** → met à jour `projects.json` + table `meta`
- **Supprimer** → supprime le `.db` + entrée dans `projects.json`

## Sauvegarde manuelle

`Cmd+S` / `Ctrl+S` déclenche la sauvegarde.  
Les modifications Budget/CR/Étapes/Risques sont **auto-sauvegardées** immédiatement via IPC (pas de dirty state pour ces tables).  
Seule la section Avancement nécessite une sauvegarde explicite (formulaires avec sliders).
