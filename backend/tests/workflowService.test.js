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

        // Ensure query was called once
        expect(query).toHaveBeenCalledTimes(1);
        
        // Verify the correct query was called
        expect(query).toHaveBeenCalledWith('SELECT * FROM workflows');
        
        // Ensure the response is an array and matches the mock data
        expect(workflows).toBeInstanceOf(Array);
        expect(workflows).toEqual(mockWorkflows);
    });

    test('should handle database errors gracefully', async () => {
        // Mock a database error
        query.mockRejectedValueOnce(new Error('Database error'));

        // Verify that the correct error is thrown
        await expect(getAllWorkflows()).rejects.toThrow('Failed to fetch workflows');

        // Ensure query was called once, even on error
        expect(query).toHaveBeenCalledTimes(1);
    });
});
