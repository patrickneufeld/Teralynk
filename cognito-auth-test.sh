#!/bin/bash

# === CONFIG ===
USER_POOL_ID="us-east-1_7c2GCeNXR"
CLIENT_ID="54jq95e5t6f2agnvr5qmqh9400"
CLIENT_SECRET="1qb8o9jipbur8hrlfbc78c9eld92goavlmd26edckrnobi8i37na"
USERNAME="patrickneufeld1111@gmail.com"
PASSWORD="Teralynk!2024Secure"
REGION="us-east-1"

# === Generate SECRET_HASH ===
export SECRET_HASH=$(node -e "const crypto = require('crypto'); const h = crypto.createHmac('sha256', '$CLIENT_SECRET'); h.update('$USERNAME$CLIENT_ID'); console.log(h.digest('base64'));")

# === Admin Authenticate with Username + Password ===
AUTH_JSON=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters "USERNAME=$USERNAME,PASSWORD=$PASSWORD,SECRET_HASH=$SECRET_HASH" \
  --region "$REGION")

echo "✅ Authenticated"

# === Extract Tokens ===
ACCESS_TOKEN=$(echo "$AUTH_JSON" | jq -r '.AuthenticationResult.AccessToken')
REFRESH_TOKEN=$(echo "$AUTH_JSON" | jq -r '.AuthenticationResult.RefreshToken')
ID_TOKEN=$(echo "$AUTH_JSON" | jq -r '.AuthenticationResult.IdToken')

echo "🔐 AccessToken:"
echo "$ACCESS_TOKEN"
echo ""
echo "🔁 RefreshToken:"
echo "$REFRESH_TOKEN"
echo ""
echo "🧾 IDToken:"
echo "$ID_TOKEN"

# === API Test Call ===
BACKEND_API_URL="http://localhost:4000/api/secure-endpoint"  # replace with your real backend

echo ""
echo "🌐 Making secure API call with AccessToken..."
curl -X GET "$BACKEND_API_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
