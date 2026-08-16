# R-46-01 : latence Trending avec index composé

Scénario de non-régression ajouté au cahier de recettes suite à la
correction de l'anomalie WEB #46.

## Précondition

Base de données de recette peuplée avec au moins 200 builds publics et
20 000 lignes dans `build_likes` (fixture `seed_perf.py`).

## Étapes

1. Appeler `GET /public/builds/trending` en désactivant le cache client.
2. Mesurer le temps de réponse serveur (header `Server-Timing` ou
   métrique Sentry Performance).
3. Exécuter `EXPLAIN ANALYZE` sur la requête SQL générée.

## Résultat attendu

- Temps de réponse serveur inférieur à 300 ms sur la recette (cible
  production : inférieur à 150 ms).
- Plan `EXPLAIN` utilise `Index Only Scan using
  ix_build_likes_build_id_created_at`.
- Aucun `Seq Scan` sur `build_likes` dans le plan.

## Résultat observé (v1.0.2, 8 juillet 2026)

- Temps de réponse serveur : **92 ms** en production.
- Plan `EXPLAIN` : `Index Only Scan` confirmé.
- `Seq Scan` sur `build_likes` : absent.

Conforme.
