const express = require('express');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const app = express();
const client = new SecretsManagerClient({ region: 'us-east-1' }); // Update region as needed

app.get('/api/secrets/:name', async (req, res) => {
  const secretName = req.params.name;

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);
    const secrets = JSON.parse(data.SecretString);
    res.json(secrets);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    res.status(500).json({ error: 'Failed to retrieve secret' });
  }
});

app.listen(5001, () => {
  console.log('Server is running on http://localhost:5001');
});
