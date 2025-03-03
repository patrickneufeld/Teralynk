import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import fetchTestUsers from "../../utils/fetchTestUsers.js";

const region = "us-east-1"; // Adjust as needed

// 🔹 Create AWS Clients
const secretsClient = new SecretsManagerClient({ region });
const cognitoClient = new CognitoIdentityProviderClient({ region });

const getSecret = async (secretName) => {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        return response.SecretString ? JSON.parse(response.SecretString) : null;
    } catch (error) {
        console.error(`❌ Failed to fetch secret: ${secretName}`, error);
        return null;
    }
};

const testLogin = async () => {
    try {
        // 🔹 Fetch Cognito Credentials from AWS Secrets Manager
        const secrets = await getSecret("Teralynk_Cognito");
        if (!secrets) throw new Error("❌ Missing AWS Cognito secrets!");

        const { COGNITO_APP_CLIENT_ID, TEST_PASSWORD } = secrets;

        const users = await fetchTestUsers();
        if (!users || users.length === 0) {
            console.error("❌ No test users found.");
            return;
        }

        const testUser = users[0]; // Pick first test user
        const username = testUser.Username;

        console.log(`🔹 Testing login with: ${username}`);

        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: COGNITO_APP_CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: TEST_PASSWORD
            }
        });

        const response = await cognitoClient.send(command);
        console.log("✅ Login Successful!", response.AuthenticationResult);

        return response.AuthenticationResult;
    } catch (error) {
        console.error("❌ Login Failed:", error.message);
    }
};

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testLogin();
}

export default testLogin;
