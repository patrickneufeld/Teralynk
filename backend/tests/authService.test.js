// Correct the path to reflect the new file structure
const authService = require('../services/auth/authService'); // Updated path

describe('authService', () => {
    it('should return a valid token', () => {
        const user = { id: '123', name: 'Test User' };
        const token = authService.generateToken(user);
        expect(token).toBeDefined();
    });

    it('should verify a valid token', () => {
        const user = { id: '123', name: 'Test User' };
        const token = authService.generateToken(user);
        const verified = authService.verifyToken(token);
        expect(verified.id).toBe(user.id);
    });
});
