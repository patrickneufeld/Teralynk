const { getAllWorkflows } = require("../services/workflowService");
const { query } = require("../services/db");

// ✅ Mock the database module
jest.mock("../services/db", () => ({
    query: jest.fn(),
}));

describe("Workflow Service - getAllWorkflows", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should fetch workflows successfully", async () => {
        const mockWorkflows = [{ id: "1", name: "Test Workflow" }];
        query.mockResolvedValueOnce({ rows: mockWorkflows });

        console.log("✅ Mocked query result:", mockWorkflows);  // ✅ Debugging Line

        const workflows = await getAllWorkflows();

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith("SELECT * FROM workflows");
        expect(workflows).toEqual(mockWorkflows);
    });

    test("should handle database errors gracefully", async () => {
        query.mockRejectedValueOnce(new Error("Database error"));

        console.log("❌ Simulated database error");  // ✅ Debugging Line

        await expect(getAllWorkflows()).rejects.toThrow("Failed to fetch workflows");

        expect(query).toHaveBeenCalledTimes(1);
    });
});
