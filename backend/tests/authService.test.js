const authService = require('../auth/authService');

describe('authService', () => {
    it('should return a valid token', () => {
        const token = authService.generateToken({ userId: 1 });
        expect(token).toBeDefined();
    });
});
