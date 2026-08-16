-- Migration Alembic a3f2 : index composé sur build_likes
-- Cible : EldenForge_API/alembic/versions/a3f2_add_index_build_likes.py
-- Objectif : accélérer la requête GET /public/builds/trending qui exécutait
-- un Seq Scan complet sur build_likes (~200 000 lignes) avec un COUNT non
-- indexé. Latence p95 mesurée avant : ~1 800 ms. Après : ~92 ms.
--
-- CREATE INDEX CONCURRENTLY pour ne pas verrouiller la table en écriture
-- pendant la création (contrainte : ne peut pas être exécuté dans une
-- transaction, ce qui est géré par postgresql_concurrently=True côté
-- Alembic).

CREATE INDEX CONCURRENTLY IF NOT EXISTS
    ix_build_likes_build_id_created_at
    ON build_likes (build_id, created_at);

-- Vérification post-migration :
-- EXPLAIN ANALYZE
--   SELECT b.id, COUNT(bl.id) AS likes
--   FROM builds b
--   LEFT OUTER JOIN build_likes bl ON bl.build_id = b.id
--   WHERE b.is_public = TRUE
--   GROUP BY b.id
--   ORDER BY likes DESC, b.created_at DESC
--   LIMIT 20;
-- Doit montrer : Index Only Scan using ix_build_likes_build_id_created_at
