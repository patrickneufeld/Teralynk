// Import AWS SDK
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1', // Replace with your AWS region
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure these environment variables are set
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
});

// Initialize AWS service clients
const cognito = new AWS.CognitoIdentityServiceProvider(); // For authentication
const s3 = new AWS.S3(); // For storage operations
const apiGateway = new AWS.ApiGatewayManagementApi(); // For API interactions

// Export configured clients for use across the application
module.exports = {
  cognito,
  s3,
  apiGateway,
};
