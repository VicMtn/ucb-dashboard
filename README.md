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
> `node:sqlite` est intégré à Node 22+ (embarqué avec Electron) et évite les dépendances natives à compiler.  
> Un shim dans `src/main/index.js` expose une API proche de `better-sqlite3` (`.prepare().all/get/run`, `.transaction()`).

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
npm start          # lancement de l'application
npm run dev        # lancement avec DevTools
npm test           # tests Node (migrations / seed DB)
```

## Build distributable

```bash
npm run build:win    # → dist/*.exe  (NSIS installer)
npm run build:mac    # → dist/*.dmg
npm run build:linux  # → dist/*.AppImage
```

> Le projet utilise `node:sqlite` natif. Aucun `electron-rebuild` n'est requis pour la couche de persistance.

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
SQLite via node:sqlite (.db fichier)
```

Aucun accès direct à Node depuis le renderer — tout passe par le preload (`contextIsolation: true`).

## Schéma & migrations

- Le schéma est versionné via la table `schema_version`.
- Les migrations s'appliquent automatiquement à l'ouverture de chaque base projet.
- Le moteur de migration est centralisé dans `src/main/db-core.js`.

## Multi-projets

- **Créer** un projet → modal → génère un ID unique (`proj_<timestamp>`), crée le `.db`, seed les tables vides, enregistre dans `projects.json`
- **Ouvrir** → charge le `.db` correspondant, ferme le précédent
- **Renommer** → met à jour `projects.json` + table `meta`
- **Supprimer** → supprime le `.db` + entrée dans `projects.json`

## Sauvegarde manuelle

`Cmd+S` / `Ctrl+S` déclenche la sauvegarde.  
Les modifications Budget/CR/Étapes/Risques sont **auto-sauvegardées** immédiatement via IPC (pas de dirty state pour ces tables).  
Seule la section Avancement nécessite une sauvegarde explicite (formulaires avec sliders).
