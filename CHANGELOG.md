# Journal des versions - EldenForge

Journal des livraisons et des correctifs de la plateforme EldenForge, tous
dépôts confondus (EldenForge_API et EldenForge_WEB). Chaque entrée indique
la date, le périmètre livré, les correctifs post-déploiement et les
liens vers les issues GitHub correspondantes.

Format inspiré de Keep a Changelog. Le versionnement suit une numérotation
majeure.mineure.patch.

---

## v1.0.0 - 2026-06-27 - Monitoring et alerting

### Ajouté
- Intégration Sentry côté back (FastAPI + Starlette) et côté front
  (SvelteKit hooks client et server).
- Téléversement automatique des sourcemaps front pendant le build via
  `@sentry/vite-plugin`, ce qui rend les traces de pile JavaScript
  lisibles depuis le dashboard Sentry.
- Configuration des environnements distincts (prod, recette) sur les
  événements Sentry pour éviter la confusion des alertes.
- Envoi du SHA du commit à chaque déploiement (`SENTRY_RELEASE`) pour
  associer une erreur à une version précise.
- Alertes email sur chaque nouvelle issue non regroupée, plus un webhook
  Discord vers le canal `#eldenforge-alerts`.

### Correctifs
- v1.0.1 : rendu PDF des tableaux de recette corrigé sur la page
  d'export.

---

## v0.9.0 - 2026-06-18 - Habillage visuel

### Ajouté
- Vitrail décoratif global sur les pages publiques (fond animé,
  cohérent avec la palette Elden Ring).
- Entrée "My profile" ajoutée au menu utilisateur (UserMenu).

### Correctifs
- v0.9.1 : passage de `$env/static/public` à `$env/dynamic/public` dans
  `hooks.client.ts` pour ne pas casser le build lorsque `SENTRY_DSN` est
  vide. Bogue détecté dans le pipeline CI.

---

## v0.8.0 - 2026-05-30 - Multi-loadouts

### Ajouté
- Plusieurs pages d'équipement nommées par build (issue WEB #41).
- Onglets Add / Rename / Duplicate / Delete dans le builder.
- Structure du payload étendue en `v2` avec conservation de la
  compatibilité `v1`.
- Cahier de recettes R-MLD-01 à R-MLD-10 rejoué avant promotion.

### Correctifs
- v0.8.1 : page détail réinitialisée sur le premier loadout au lieu du
  dernier `activeIndex` sauvegardé (issue WEB #42). Détecté par un
  retour utilisateur en recette.

---

## v0.7.0 - 2026-05-22 - Badge DLC

### Ajouté
- Champ `has_dlc` côté API sur les items dérivés de Shadow of the
  Erdtree.
- Badge visuel "SOTE" côté front sur BuildCard et pages détail.
- Filtre "DLC" sur la page Explore.

---

## v0.6.0 - 2026-05-15 - Codex

### Ajouté
- Encyclopédie complète des items du jeu, neuf sous-pages catégorielles
  (armes, armures, talismans, sorts, incantations, cendres, esprits,
  larmes, munitions).
- Composants CodexHeader et CodexCard réutilisables.
- Lien direct "See builds" depuis chaque item vers Explore filtré.

---

## v0.5.0 - 2026-05-08 - Profils publics

### Ajouté
- Page publique `/u/<pseudo>` avec la grille des builds publics de
  l'auteur.
- Bannière générée à partir d'un hash déterministe du pseudo pour
  identité visuelle unique.

### Correctifs
- v0.5.1 : retrait des logos, capsules et wallpapers FromSoftware pour
  respecter les guidelines de fan content. Notice de copyright ajoutée
  en pied de page.

---

## v0.4.0 - 2026-04-30 - Multi-armes et munitions

### Ajouté
- Support de trois armes par main dans un même build.
- Support de quatre types de munitions (flèches, carreaux, gros
  carreaux, boulets).
- Sérialiseur mis à jour vers `v1` étendu.

### Correctifs
- v0.4.1 : désérialisation rétrocompatible des builds `v1` initiaux vers
  la nouvelle structure d'armes secondaires (aucune migration de
  données requise).

---

## v0.3.0 - 2026-04-24 - Découverte

### Ajouté
- Recherche par item (autocomplete sur toute la base d'objets).
- Tri "Trending" combinant récence et popularité.
- Tags groupés par catégorie (build style, arme, sort).

### Correctifs
- v0.3.1 : tri Trending passé en `outerjoin` SQL pour ne pas masquer
  les builds sans like récent.

---

## v0.2.0 - 2026-04-17 - Communauté

### Ajouté
- Builds publics visibles sans compte.
- Likes anonymes bloqués, likes connectés persistants.
- Forks publics avec conservation du lien `forked_from_id` en base.
- Filtres tags sur Explore.

---

## v0.1.0 - 2026-04-10 - MVP

### Ajouté
- Inscription, connexion, déconnexion avec vérification email et
  lockout après cinq échecs.
- Création et sauvegarde de builds privés.
- Datasets Elden Ring de base (armes, armures, talismans, sorts).
- Calculateur d'Attack Rating temps réel.

---

## Versions à venir (feuille de route)

- **v1.1** : commentaires sur les builds publics.
- **v1.2** : audit d'accessibilité RGAA par un tiers agréé.
- **v1.3** : tableau de bord Grafana avec métriques temps réel
  (latence, uptime, taux d'erreur, top requêtes lentes).
- **v1.4** : suppression de compte conforme RGPD (droit à l'effacement).
