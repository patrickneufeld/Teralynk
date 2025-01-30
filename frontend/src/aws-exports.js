// File Path: /frontend/src/aws-exports.js

const awsConfig = {
    Auth: {
        region: 'us-east-1', // Your AWS Region
        userPoolId: 'us-east-1_9KyYdARIP', // Cognito User Pool ID
        userPoolWebClientId: '5r6m6ab24gr90r7tl7svn8e5hc', // Cognito App Client ID
    },
    Storage: {
        bucket: 'teralynk-storage', // S3 Bucket Name for file uploads
        region: 'us-east-1', // S3 Bucket Region
    },
    API: {
        endpoints: [
            {
                name: 'APIGateway',
                endpoint: 'http://localhost:5001', // Your backend API Gateway endpoint for local development
                region: 'us-east-1', // API Gateway Region
            },
        ],
    },
    OAuth: {
        domain: 'teralynk.auth.us-east-1.amazoncognito.com', // Cognito Auth Domain
        scope: ['email', 'openid', 'profile'], // Scopes for OAuth
        redirectSignIn: 'http://localhost:3000/', // Redirect URL after login
        redirectSignOut: 'http://localhost:3000/', // Redirect URL after logout
        responseType: 'code', // Authorization Code Grant flow
    },
};

export default awsConfig;
