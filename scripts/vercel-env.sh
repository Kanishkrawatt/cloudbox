#!/usr/bin/env bash
# Pushes the local .env.local values to a Vercel project.
#
# Usage:  vercel login && vercel link   # once, interactive
#         ./scripts/vercel-env.sh [production|preview|development]
#
# Re-running replaces existing values (it removes, then re-adds each key).
set -euo pipefail

TARGET="${1:-production}"
ENV_FILE=".env.local"

[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE found."; exit 1; }

KEYS=(
  NEXT_PUBLIC_api_Key
  NEXT_PUBLIC_auth_Domain
  NEXT_PUBLIC_database_URL
  NEXT_PUBLIC_project_Id
  NEXT_PUBLIC_messaging_Sender_Id
  NEXT_PUBLIC_app_Id
  NEXT_PUBLIC_measurement_Id
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  CRON_SECRET
)

for key in "${KEYS[@]}"; do
  value="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)"
  if [ -z "$value" ]; then
    echo "skip   $key (empty locally)"
    continue
  fi
  vercel env rm "$key" "$TARGET" --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$key" "$TARGET" >/dev/null
  echo "pushed $key -> $TARGET"
done

echo
echo "Done. Deploy with:  vercel --prod"
