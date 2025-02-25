import hmac
import hashlib
import base64

# Replace these with your actual values
CLIENT_ID = '54jq95e5t6f2agnvr5qmqh9400'
CLIENT_SECRET = '1qb8o9jipbur8hrlfbc78c9eld92goavlmd26edckrnobi8i37na'
USERNAME = 'my_admin'

# Generate the secret hash
message = USERNAME + CLIENT_ID
digest = hmac.new(CLIENT_SECRET.encode(), message.encode(), hashlib.sha256).digest()
secret_hash = base64.b64encode(digest).decode()

print('SECRET_HASH:', secret_hash)
