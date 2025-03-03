import { SecretsManagerClient, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const region = "us-east-1"; // Adjust as needed
const secretName = "Teralynk_Cognito";

const secretsClient = new SecretsManagerClient({ region });

const updateSecret = async (userPoolClientId) => {
    try {
        // Fetch existing secret
        const secretValue = {
            username: "test_user",
            password: "test_password",
            userPoolClientId, // Updating the App Client ID
        };

        const command = new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify(secretValue),
        });

        await secretsClient.send(command);
        console.log(`✅ AWS Secrets Manager updated successfully for ${secretName}`);
    } catch (error) {
        console.error(`❌ Failed to update secret: ${secretName}`, error);
    }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const userPoolClientId = process.argv[2];
    if (!userPoolClientId) {
        console.error("❌ Missing userPoolClientId. Usage: node updateCognitoSecret.js <userPoolClientId>");
        process.exit(1);
    }
    updateSecret(userPoolClientId);
}

export default updateSecret;
