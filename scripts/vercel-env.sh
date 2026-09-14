#!/usr/bin/env bash
# Pushes the local .env.local values to the linked Vercel project.
#
# Usage:  vercel login && vercel link     # once, interactive
#         ./scripts/vercel-env.sh [production|preview|development]
#
# --force overwrites an existing value, so re-running is safe. Secrets are
# stored as sensitive (write-only) values; the public NEXT_PUBLIC_* ones are
# not, since they ship to the browser anyway.
set -uo pipefail

TARGET="${1:-production}"
ENV_FILE=".env.local"

[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE found."; exit 1; }

PUBLIC_KEYS=(
  NEXT_PUBLIC_api_Key
  NEXT_PUBLIC_auth_Domain
  NEXT_PUBLIC_database_URL
  NEXT_PUBLIC_project_Id
  NEXT_PUBLIC_messaging_Sender_Id
  NEXT_PUBLIC_app_Id
  NEXT_PUBLIC_measurement_Id
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  FACE_API_URL
)
SECRET_KEYS=(
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  CRON_SECRET
  FACE_API_KEY
)

push() {
  local key="$1" sensitivity="$2"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2-)"
  if [ -z "$value" ]; then
    echo "skip   $key (empty locally)"
    return
  fi
  if vercel env add "$key" "$TARGET" --force "$sensitivity" --value "$value" >/dev/null 2>&1; then
    echo "pushed $key -> $TARGET"
  else
    echo "FAILED $key"
  fi
}

for key in "${PUBLIC_KEYS[@]}"; do push "$key" --no-sensitive; done
for key in "${SECRET_KEYS[@]}"; do push "$key" --sensitive; done

echo
echo "Done. Deploy with:  vercel --prod"
