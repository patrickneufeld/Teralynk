import AWS from "aws-sdk";

// Configure AWS SDK
AWS.config.update({ region: "us-east-1" });

const secretsManager = new AWS.SecretsManager();

// Function to get secret from AWS Secrets Manager
export const getSecretValue = async (secretName) => {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if (data.SecretString) {
      return JSON.parse(data.SecretString);  // Return the secret in parsed JSON format
    } else {
      const buff = Buffer.from(data.SecretBinary, 'base64');
      return JSON.parse(buff.toString('ascii'));
    }
  } catch (error) {
    console.error("Error retrieving secret from AWS:", error.message);
    throw new Error('Failed to retrieve secret');
  }
};
