import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const region = "us-east-1"; // ✅ Ensure this is correct

// 🔹 AWS Clients
const secretsClient = new SecretsManagerClient({ region });
const cognitoClient = new CognitoIdentityProviderClient({ region });

// 🔍 Fetch AWS Secret
const getSecret = async (secretName) => {
    try {
        console.log(`🔍 Retrieving secret: ${secretName}...`);
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        if (!response.SecretString) throw new Error(`🚨 Secret "${secretName}" is empty!`);

        const parsedSecret = JSON.parse(response.SecretString.trim()); // 🚀 Ensure clean parsing
        console.log(`✅ Secret Retrieved:`, parsedSecret);
        return parsedSecret;
    } catch (error) {
        console.error(`❌ Failed to fetch secret: ${secretName}`, error);
        return null;
    }
};

// 🔍 Fetch Cognito Test Users
const fetchTestUsers = async () => {
    try {
        // 🔹 Retrieve Cognito Credentials
        const secrets = await getSecret("Teralynk_Cognito");
        if (!secrets) throw new Error("❌ Missing AWS Cognito secrets!");

        const userPoolId = secrets.userPoolId || secrets.COGNITO_USER_POOL_ID; // Ensure fallback
        if (!userPoolId) throw new Error("❌ Missing Cognito User Pool ID!");

        console.log(`🔍 Fetching users from Cognito User Pool: ${userPoolId}...`);

        const command = new ListUsersCommand({
            UserPoolId: userPoolId,
            Limit: 10, // Adjust as needed
        });

        const response = await cognitoClient.send(command);
        if (!response.Users || response.Users.length === 0) {
            console.warn("⚠️ No test users found in Cognito.");
            return [];
        }

        console.log("✅ Test Users Found:", response.Users.map(user => ({
            username: user.Username,
            email: user.Attributes.find(attr => attr.Name === "email")?.Value || "N/A",
            createdAt: user.UserCreateDate,
            status: user.UserStatus
        })));

        return response.Users;
    } catch (error) {
        console.error("❌ Error fetching test users:", error);
    }
};

// ✅ Run the function if executed as a standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
    fetchTestUsers();
}

export default fetchTestUsers;
