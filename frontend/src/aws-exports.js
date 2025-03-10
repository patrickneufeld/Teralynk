// File Path: /frontend/src/aws-exports.js

const awsConfig = {
    Auth: {
        // ✅ AWS Region
        region: 'us-east-1',

        // ✅ Cognito User Pool Details
        userPoolId: 'us-east-1_9KyYdARIP', // Cognito User Pool ID
        userPoolWebClientId: '5r6m6ab24gr90r7tl7svn8e5hc', // Cognito App Client ID
    },
    Storage: {
        // ✅ S3 Configuration for File Uploads
        bucket: 'teralynk-storage', // S3 Bucket Name
        region: 'us-east-1', // S3 Bucket Region
    },
    API: {
        // ✅ API Gateway Configuration
        endpoints: [
            {
                name: 'APIGateway',
                endpoint: 'http://localhost:5001', // Backend API for local development
                region: 'us-east-1',
            },
        ],
    },
    OAuth: {
        // ✅ OAuth for Cognito Authentication
        domain: 'teralynk.auth.us-east-1.amazoncognito.com', // Cognito Auth Domain
        scope: ['email', 'openid', 'profile'], // Requested Scopes
        redirectSignIn: 'http://localhost:3000/', // Redirect URL after login
        redirectSignOut: 'http://localhost:3000/', // Redirect URL after logout
        responseType: 'code', // Authorization Code Flow
    },
};

export default awsConfig;
