// File Path: backend/tests/workflowService.test.js

const { getAllWorkflows } = require('../services/workflowService');
const { query } = require('../services/db');

// Mock the database module
jest.mock('../services/db', () => ({
    query: jest.fn(),
}));

describe('Workflow Service - getAllWorkflows', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock calls and instances before each test
    });

    test('should fetch workflows successfully', async () => {
        // Mock database response
        const mockWorkflows = [{ id: '1', name: 'Test Workflow' }];
        query.mockResolvedValueOnce({ rows: mockWorkflows });

        const workflows = await getAllWorkflows();

        expect(query).toHaveBeenCalledTimes(1); // Ensure query was called once
        expect(query).toHaveBeenCalledWith('SELECT * FROM workflows'); // Verify correct query
        expect(workflows).toBeInstanceOf(Array);
        expect(workflows).toEqual(mockWorkflows);
    });

    test('should handle database errors gracefully', async () => {
        query.mockRejectedValueOnce(new Error('Database error'));

        await expect(getAllWorkflows()).rejects.toThrow('Failed to fetch workflows');

        expect(query).toHaveBeenCalledTimes(1); // Ensure query was called even on error
    });
});
