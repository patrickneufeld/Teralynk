const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports = cognito;
