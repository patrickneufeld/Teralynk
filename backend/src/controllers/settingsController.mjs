const { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = 'settings';

/**
 * Controller to retrieve current settings.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSettings = async (req, res) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: marshall({ user_id: req.user.id }),
        };

        const { Item } = await dynamoDBClient.send(new GetItemCommand(params));

        if (!Item) {
            return res.status(404).json({ success: false, message: 'Settings not found.' });
        }

        const settings = unmarshall(Item);
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
};

/**
 * Controller to update settings.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateSettings = async (req, res) => {
    try {
        const { theme, notifications, language } = req.body;

        // Validate input data
        if (!theme || typeof notifications !== 'boolean' || !language) {
            return res.status(400).json({ success: false, message: 'Invalid input data.' });
        }

        const params = {
            TableName: TABLE_NAME,
            Key: marshall({ user_id: req.user.id }),
            UpdateExpression: 'SET theme = :theme, notifications = :notifications, language = :language',
            ExpressionAttributeValues: marshall({
                ':theme': theme,
                ':notifications': notifications,
                ':language': language,
            }),
            ReturnValues: 'ALL_NEW',
        };

        const { Attributes } = await dynamoDBClient.send(new UpdateItemCommand(params));

        const updatedSettings = unmarshall(Attributes);
        res.status(200).json({ success: true, data: updatedSettings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings.' });
    }
};

export {
    getSettings,
    updateSettings,
};
