import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const REGION = process.env.AWS_REGION || "us-east-1";
const SECRET_ID = process.env.SECRET_NAME || process.env.SECRETS_MANAGER_NAME;

console.log(`🔍 Testing SecretsManager with SECRET_ID: ${SECRET_ID} in REGION: ${REGION}`);

const client = new SecretsManagerClient({ region: REGION });

async function testSecret() {
  try {
    const result = await client.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));
    console.log('✅ Success:', result);
  } catch (error) {
    console.error('❌ Caught Error:', error);
  }
}

testSecret();
