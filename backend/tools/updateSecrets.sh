#!/bin/bash

# /Users/patrick/Projects/Teralynk/backend/tools/updateSecrets.sh
# ✅ Uploads teralynk-env-fixed.json to AWS Secrets Manager under: teralynk/env
# ✅ Compares with all .env files and warns about missing keys

set -euo pipefail

SECRET_NAME="teralynk/env"  # ✅ UPDATED Secret ID
REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="$SCRIPT_DIR/teralynk-env-fixed.json"

# ✅ Paths to check for .env values
ENV_PATHS=(
  "$SCRIPT_DIR/../../.env"
  "$SCRIPT_DIR/../.env"
  "$SCRIPT_DIR/../../frontend/.env"
)

# ✅ Ensure the JSON file exists
if [ ! -f "$SECRETS_FILE" ]; then
  echo "❌ Missing $SECRETS_FILE — please create it first."
  exit 1
fi

# ✅ Read JSON keys from secrets file
JSON_KEYS=$(jq -r 'keys[]' "$SECRETS_FILE")

# ✅ Gather all keys from .env files
ENV_KEYS=()
for env_file in "${ENV_PATHS[@]}"; do
  if [ -f "$env_file" ]; then
    echo "🔍 Checking: $env_file"
    while IFS='=' read -r key _; do
      [[ -n "$key" && ! "$key" =~ ^# ]] && ENV_KEYS+=("$key")
    done < "$env_file"
  fi
done

# ✅ Detect missing keys
echo "🧠 Comparing .env keys to $SECRETS_FILE..."

MISSING_KEYS=()
for env_key in "${ENV_KEYS[@]}"; do
  if ! echo "$JSON_KEYS" | grep -q "^$env_key$"; then
    MISSING_KEYS+=("$env_key")
  fi
done

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
  echo "⚠️  The following keys are in .env files but MISSING from $SECRETS_FILE:"
  for key in "${MISSING_KEYS[@]}"; do
    echo "   - $key"
  done
  echo "❗ Please update $SECRETS_FILE to include these keys if needed."
else
  echo "✅ All .env keys are present in $SECRETS_FILE."
fi

# ✅ Upload to AWS
SECRETS_JSON=$(cat "$SECRETS_FILE")

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &> /dev/null; then
  echo "🔁 Updating existing secret: $SECRET_NAME"
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --secret-string "$SECRETS_JSON"
else
  echo "➕ Creating new secret: $SECRET_NAME"
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --region "$REGION" \
    --secret-string "$SECRETS_JSON"
fi

echo "✅ Secrets uploaded to AWS Secrets Manager: $SECRET_NAME"
