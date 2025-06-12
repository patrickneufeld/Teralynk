/**
 * Auth Utils Tests
 * 
 * This module contains tests for the authentication utilities.
 */

import { 
  normalizeUserData, 
  extractUserId, 
  extractEmail, 
  extractRole,
  hasPermission
} from '../authUtils';

// Mock the extractUserId, extractEmail, and extractRole functions
jest.mock('../authUtils', () => {
  const originalModule = jest.requireActual('../authUtils');
  
  return {
    ...originalModule,
    extractUserId: jest.fn(),
    extractEmail: jest.fn(),
    extractRole: jest.fn()
  };
});

describe('normalizeUserData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.debug = jest.fn();
  });
  
  it('should normalize user data correctly', () => {
    // Mock the extract functions to return test values
    extractUserId.mockReturnValue('test-user-id');
    extractEmail.mockReturnValue('test@example.com');
    extractRole.mockReturnValue('user');
    
    const apiResponse = { name: 'Test User' };
    const profile = { UserAttributes: [] };
    
    const result = normalizeUserData(apiResponse, profile);
    
    expect(result).toEqual({
      name: 'Test User',
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      lastAuthenticated: expect.any(String),
      sessionId: expect.any(String)
    });
  });
  
  it('should throw an error if user ID is missing', () => {
    // Mock extractUserId to return null (no user ID found)
    extractUserId.mockReturnValue(null);
    extractEmail.mockReturnValue('test@example.com');
    extractRole.mockReturnValue('user');
    
    const apiResponse = { name: 'Test User' };
    const profile = { UserAttributes: [] };
    
    expect(() => {
      normalizeUserData(apiResponse, profile);
    }).toThrow('User ID is missing in user profile response');
    
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle nested data structures', () => {
    extractUserId.mockReturnValue('test-user-id');
    extractEmail.mockReturnValue('test@example.com');
    extractRole.mockReturnValue('user');
    
    const apiResponse = { 
      data: { 
        user: { 
          name: 'Test User',
          preferences: { theme: 'dark' }
        } 
      } 
    };
    const profile = { UserAttributes: [] };
    
    const result = normalizeUserData(apiResponse, profile);
    
    expect(result).toEqual({
      name: 'Test User',
      preferences: { theme: 'dark' },
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      lastAuthenticated: expect.any(String),
      sessionId: expect.any(String)
    });
  });
});

describe('hasPermission', () => {
  it('should return true if user has the required role', () => {
    const user = { role: 'user' };
    expect(hasPermission(user, 'user')).toBe(true);
  });
  
  it('should return true if user is admin', () => {
    const user = { role: 'admin' };
    expect(hasPermission(user, 'user')).toBe(true);
  });
  
  it('should return false if user does not have the required role', () => {
    const user = { role: 'user' };
    expect(hasPermission(user, 'admin')).toBe(false);
  });
  
  it('should handle array of required roles', () => {
    const user = { role: 'editor' };
    expect(hasPermission(user, ['user', 'editor'])).toBe(true);
    expect(hasPermission(user, ['admin', 'superuser'])).toBe(false);
  });
  
  it('should return false if user is null or undefined', () => {
    expect(hasPermission(null, 'user')).toBe(false);
    expect(hasPermission(undefined, 'user')).toBe(false);
  });
  
  it('should return false if user has no role', () => {
    const user = { name: 'Test User' };
    expect(hasPermission(user, 'user')).toBe(false);
  });
});
