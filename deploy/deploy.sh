#!/usr/bin/env bash
# Déploiement du front EldenForge sur le VPS.
# Appelé par GitHub Actions (workflow deploy.yml) via SSH.
# Usage : deploy.sh <prod|recette>
set -euo pipefail

ENV="${1:?usage: deploy.sh <prod|recette>}"
if [ "$ENV" = "prod" ]; then
  DIR=/opt/eldenforge
  BRANCH=main
  SVC=eldenforge-web
elif [ "$ENV" = "recette" ]; then
  DIR=/opt/eldenforge-recette
  BRANCH=recette
  SVC=eldenforge-web-recette
else
  echo "env inconnu: $ENV (attendu: prod|recette)" >&2
  exit 1
fi

cd "$DIR/EldenForge_WEB"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
npm ci
npm run build
sudo systemctl restart "$SVC"
echo "WEB ($ENV) déployée depuis origin/$BRANCH."
