const AWS = require("aws-sdk");

// Initialize AWS Secrets Manager Client
const secretsManager = new AWS.SecretsManager({
  region: "us-east-1",
});

async function getSecrets() {
  try {
    const data = await secretsManager
      .getSecretValue({ SecretId: "teralynk/env" })
      .promise();

    if (data.SecretString) {
      const secrets = JSON.parse(data.SecretString);

      // Set environment variables dynamically
      process.env.DB_CONNECTION_STRING = secrets.DB_CONNECTION_STRING;
      process.env.MONGO_URI = secrets.MONGO_URI;
      process.env.COGNITO_CLIENT_ID = secrets.COGNITO_CLIENT_ID;
      process.env.COGNITO_CLIENT_SECRET = secrets.COGNITO_CLIENT_SECRET;
      process.env.JWT_SECRET = secrets.JWT_SECRET;
      process.env.SESSION_SECRET = secrets.SESSION_SECRET;
      process.env.AWS_REGION = secrets.AWS_REGION;
      process.env.BUCKET_NAME = secrets.BUCKET_NAME;

      console.log("✅ AWS Secrets Loaded Successfully");
    }
  } catch (error) {
    console.error("❌ Error fetching secrets from AWS Secrets Manager:", error);
  }
}

module.exports = { getSecrets };
