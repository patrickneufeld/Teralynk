import base64
import hmac
import hashlib
import boto3
import os

# Load Cognito Credentials from Environment Variables
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "54jq95e5t6f2agnvr5qmqh9400")
COGNITO_CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET", "1qb8o9jipbur8hrlfbc78c9eld92goavlmd26edckrnobi8i37na")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_7c2GCeNXR")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Initialize AWS Cognito client
client = boto3.client("cognito-idp", region_name=AWS_REGION)

def generate_secret_hash(username):
    """Generate Cognito SECRET_HASH using ClientSecret and Username."""
    message = username + COGNITO_CLIENT_ID
    dig = hmac.new(COGNITO_CLIENT_SECRET.encode(), message.encode(), hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

def authenticate(username, password):
    """Authenticate user with Cognito and return authentication tokens."""
    try:
        response = client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            ClientId=COGNITO_CLIENT_ID,
            AuthParameters={
                "USERNAME": username,
                "PASSWORD": password,
                "SECRET_HASH": generate_secret_hash(username)
            }
        )
        return response["AuthenticationResult"]
    
    except client.exceptions.NotAuthorizedException:
        return {"error": "Invalid username or password."}
    
    except client.exceptions.UserNotFoundException:
        return {"error": "User does not exist."}
    
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    auth_result = authenticate(username, password)

    if "AccessToken" in auth_result:
        print("\n✅ Authentication Successful!")
        print("Access Token:", auth_result["AccessToken"])
        print("ID Token:", auth_result["IdToken"])
        print("Refresh Token:", auth_result["RefreshToken"])
    else:
        print("\n❌ Authentication Failed:", auth_result["error"])
