// File Path: backend/tests/api/workflows.test.js

const request = require('supertest');
const app = require('../../server');
const { getAllWorkflows } = require('../../services/workflowService');

// Mock the workflowService
jest.mock('../../services/workflowService', () => ({
    getAllWorkflows: jest.fn(),
}));

// Mock the authentication middleware
jest.mock('../../middleware/authMiddleware', () => ({
    authenticate: (req, res, next) => {
        req.user = { id: 'mockUserId', role: 'user' }; // Mock user data
        next();
    },
}));

describe('GET /api/workflows', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Ensure mocks are cleared before each test
    });

    test('should return a list of workflows', async () => {
        const mockWorkflows = [{ id: '1', name: 'Test Workflow' }];
        getAllWorkflows.mockResolvedValueOnce(mockWorkflows);

        const response = await request(app)
            .get('/api/workflows')
            .set('Authorization', 'Bearer valid.jwt.token');

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockWorkflows);
        expect(getAllWorkflows).toHaveBeenCalledTimes(1);
    });

    test('should handle errors gracefully', async () => {
        getAllWorkflows.mockRejectedValueOnce(new Error('Service error'));

        const response = await request(app)
            .get('/api/workflows')
            .set('Authorization', 'Bearer valid.jwt.token');

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Failed to fetch workflows');
        expect(getAllWorkflows).toHaveBeenCalledTimes(1);
    });
});
