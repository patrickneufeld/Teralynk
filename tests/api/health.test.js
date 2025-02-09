// File Path: backend/tests/api/health.test.js

const request = require('supertest');
const app = require('../../server'); // Adjust path if server.js is located elsewhere

describe('GET /api/health', () => {
    test('should return health status with 200 status code', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            status: 'OK',
            environment: process.env.NODE_ENV,
        });
    });

    test('should handle missing ENABLE_HEALTH_CHECK environment variable gracefully', async () => {
        // Temporarily unset the ENABLE_HEALTH_CHECK environment variable
        const originalEnableHealthCheck = process.env.ENABLE_HEALTH_CHECK;
        process.env.ENABLE_HEALTH_CHECK = undefined;

        const tempApp = require('../../server'); // Reload app with updated env
        const response = await request(tempApp).get('/api/health');

        // Restore the original environment variable
        process.env.ENABLE_HEALTH_CHECK = originalEnableHealthCheck;

        expect(response.statusCode).toBe(404); // Health check endpoint disabled
    });
});
