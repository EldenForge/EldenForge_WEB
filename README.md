# Elden Forge Web

Application web pour créer des builds Elden Ring à partir du catalogue de l'API Elden Forge.

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- L'API Elden Forge lancée en local (voir `EldenForge_API/`)

## Installation

```bash
npm install
```

## Lancer l'application

```bash
# 1. S'assurer que l'API tourne sur le port 8000
cd ../EldenForge_API
uvicorn main:app --reload

# 2. Lancer le front
cd ../EldenForge_WEB
npm run dev
```

## Liens

| Ressource | URL |
|-----------|-----|
| Application | http://localhost:5173 |
| API (requise) | http://localhost:8000 |

## Configuration

Le proxy Vite redirige automatiquement les appels `/api/*` vers `http://localhost:8000` en développement.

Pour changer l'URL de l'API, créer un fichier `.env.local` :

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Stack technique

| Technologie | Usage |
|-------------|-------|
| SvelteKit | Framework front |
| Svelte 5 | Composants (runes) |
| TypeScript | Typage |
| TailwindCSS | Styles utilitaires |

## Structure du projet

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts       # Fetch wrapper + parsing réponses API
│   │   └── items.ts        # Fonctions API (armors, talismans, weapons, shields)
│   ├── stores/
│   │   └── build.ts        # Store Svelte pour l'état du build
│   └── types.ts            # Types TypeScript (Armor, Talisman, Weapon, etc.)
├── routes/
│   ├── +layout.svelte      # Layout principal
│   └── +page.svelte        # Page "Build Creator"
├── app.html                # Shell HTML + Google Fonts (Cinzel)
└── app.css                 # Thème Elden Ring (Tailwind + custom)
```

## Fonctionnalités

- **Sélection d'armure** : Tête, Plastron, Gants, Jambes (filtrés par catégorie)
- **Sélection de talismans** : 4 slots avec affichage de l'effet
- **Sélection d'armes** : Main droite (armes) + Main gauche (armes + boucliers)
- **Récapitulatif du build** : Noms, poids par pièce, poids total
- **Reset** : Vider tout le build
- **Copy JSON** : Copier le build dans le presse-papier

## Endpoints API utilisés

| Endpoint | Usage |
|----------|-------|
| `GET /armors` | Liste des armures (Head, Chest, Hands, Legs) |
| `GET /talismans` | Liste des talismans |
| `GET /weapons` | Liste des armes |
| `GET /shields` | Liste des boucliers (main gauche) |

## Build production

```bash
npm run build
npm run preview
```
