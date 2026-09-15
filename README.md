# Gestion Finance - Église Gloire de Dieu

Application de gestion financière pour la paroisse de Kyeshero.
Application de bureau (Tauri) avec base de données SQLite locale — 100% hors ligne.

## Prérequis

- [Node.js](https://nodejs.org/) 18+ et npm
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri CLI](https://tauri.app/) — installé automatiquement via npm

### Prérequis système (Tauri)

**Linux :** `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

**Windows :** Microsoft Visual Studio C++ Build Tools

**macOS :** Xcode Command Line Tools (`xcode-select --install`)

## Installation

```bash
npm install
```

## Développement (mode web)

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:1420`.

En mode web (sans Tauri), la base de données SQLite est stockée dans le localStorage du navigateur.

## Développement (mode desktop Tauri)

```bash
npm run tauri:dev
```

Cela lance l'application dans une fenêtre de bureau native. La base de données SQLite est stockée dans le dossier de données de l'application sur le disque.

## Compilation de l'exécutable

```bash
npm run tauri:build
```

Les exécutables sont générés dans `src-tauri/target/release/` :
- **Windows :** `.exe` et `.msi`
- **macOS :** `.app` et `.dmg`
- **Linux :** `.deb` et `.AppImage`

## Mots de passe par défaut

- **Mot de passe d'accès** (connexion au tableau de bord) : `admin123`
- **Mot de passe de confirmation des sorties** : `sortie123`

Ces mots de passe peuvent être modifiés dans la page **Paramètres**.

## Fonctionnalités

- **Tableau de bord** : totaux par catégorie, graphiques, calcul automatique des reversements (20% communauté centrale, 10% apôtre)
- **Entrées** : enregistrement des dîmes, offrandes, dons avec génération automatique de reçu PDF
- **Sorties** : enregistrement des décaissements avec mot de passe de confirmation et reçu PDF
- **Rapports** : génération de rapports PDF hebdomadaires, mensuels, trimestriels et annuels
- **Paramètres** : configuration de l'église, mots de passe, démarrage d'un nouvel exercice financier

## Base de données

La base de données SQLite contient les tables suivantes :
- `config` : paramètres de l'application (nom, paroisse, mots de passe)
- `categories` : catégories de recettes (Dîmes, Offrandes, Actions de Grâce, etc.)
- `entrees` : enregistrements des entrées financières
- `sorties` : enregistrements des sorties financières
- `reversements` : enregistrements des reversements (20% et 10%)
- `exercices` : archives des exercices financiers précédents

## Structure du projet

```
├── src/
│   ├── components/      # Composants React
│   ├── pages/           # Pages (Home, Dashboard, EntryForm, ExitForm, Reports, Settings)
│   ├── hooks/           # Hooks (useConfig, useFinance)
│   ├── lib/             # Base de données SQLite (database.ts, schema.ts)
│   ├── services/        # Génération PDF
│   ├── types/           # Types TypeScript
│   └── utils/           # Helpers (formatage FC, dates)
├── src-tauri/
│   ├── src/             # Code Rust (Tauri)
│   ├── capabilities/   # Permissions Tauri
│   ├── Cargo.toml       # Dépendances Rust
│   └── tauri.conf.json  # Configuration Tauri
└── package.json
```
