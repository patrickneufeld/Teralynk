const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const secretsManager = new AWS.SecretsManager();

const getSecret = async (secretName) => {
  try {
    console.log("🔍 Fetching secrets using name:", secretName);
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if (data.SecretString) {
      return JSON.parse(data.SecretString);
    }
  } catch (error) {
    console.error("❌ Unable to fetch secrets:", error);
    throw error;
  }
};

(async () => {
  try {
    const secrets = await getSecret(process.env.SECRETS_MANAGER_NAME);
    console.log("✅ Fetched Secrets:", secrets);
  } catch (error) {
    console.error("❌ Error Fetching Secrets:", error);
  }
})();
