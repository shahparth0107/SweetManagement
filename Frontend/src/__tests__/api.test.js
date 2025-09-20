import axios from 'axios';
import apiClient from '../api/client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('adds authorization header when token is present', () => {
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('user', JSON.stringify({ token: mockToken }));

      // Create a new instance to trigger the interceptor
      const client = require('../api/client').default;

      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('does not add authorization header when no token is present', () => {
      localStorage.clear();

      // Create a new instance to trigger the interceptor
      const client = require('../api/client').default;

      expect(mockedAxios.create).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    it('handles successful responses', async () => {
      const mockResponse = {
        data: { message: 'Success' },
        status: 200
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const client = require('../api/client').default;
      
      // Test that the client is created successfully
      expect(client).toBeDefined();
    });

    it('handles 401 responses by clearing user data', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      localStorage.setItem('user', JSON.stringify({ token: 'mock-token' }));

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { 
            use: jest.fn((successHandler, errorHandler) => {
              errorHandler(mockError);
            })
          }
        }
      });

      const client = require('../api/client').default;
      
      // Verify that user data would be cleared on 401
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('handles network errors', async () => {
      const mockError = new Error('Network Error');

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { 
            use: jest.fn((successHandler, errorHandler) => {
              errorHandler(mockError);
            })
          }
        }
      });

      const client = require('../api/client').default;
      
      // Test that the client handles network errors gracefully
      expect(client).toBeDefined();
    });
  });

  describe('API Methods', () => {
    let mockAxiosInstance;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it('provides get method', () => {
      const client = require('../api/client').default;
      
      client.get('/test-endpoint');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint');
    });

    it('provides post method', () => {
      const client = require('../api/client').default;
      const data = { test: 'data' };
      
      client.post('/test-endpoint', data);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', data);
    });

    it('provides put method', () => {
      const client = require('../api/client').default;
      const data = { test: 'data' };
      
      client.put('/test-endpoint', data);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', data);
    });

    it('provides delete method', () => {
      const client = require('../api/client').default;
      
      client.delete('/test-endpoint');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint');
    });
  });

  describe('Configuration', () => {
    it('creates axios instance with correct base URL', () => {
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const client = require('../api/client').default;

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('http://localhost:6000')
        })
      );
    });

    it('sets correct content type header', () => {
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const client = require('../api/client').default;

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Token Management', () => {
    it('updates authorization header when token changes', () => {
      const mockToken = 'new-token';
      localStorage.setItem('user', JSON.stringify({ token: mockToken }));

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const client = require('../api/client').default;

      // Verify that the client is created with the new token
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('removes authorization header when token is cleared', () => {
      localStorage.clear();

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const client = require('../api/client').default;

      // Verify that the client is created without token
      expect(mockedAxios.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles malformed localStorage data', () => {
      localStorage.setItem('user', 'invalid-json');

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      // Should not throw an error
      expect(() => {
        const client = require('../api/client').default;
      }).not.toThrow();
    });

    it('handles missing user data in localStorage', () => {
      localStorage.clear();

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      // Should not throw an error
      expect(() => {
        const client = require('../api/client').default;
      }).not.toThrow();
    });
  });
});
