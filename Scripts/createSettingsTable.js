const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// DynamoDB Client Configuration
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1', // Set your region
});

/**
 * Create the "settings" table.
 */
const createSettingsTable = async () => {
    const params = {
        TableName: 'settings',
        KeySchema: [
            { AttributeName: 'user_id', KeyType: 'HASH' }, // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: 'user_id', AttributeType: 'S' }, // String type
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        const data = await dynamoClient.send(new CreateTableCommand(params));
        console.log('Table created successfully:', data.TableDescription.TableName);
    } catch (error) {
        console.error('Error creating table:', error);
    }
};

createSettingsTable();
