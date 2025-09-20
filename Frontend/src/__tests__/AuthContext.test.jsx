import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, register, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-info">
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => register('testuser', 'test@example.com', 'password')}>
        Register
      </button>
      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <SnackbarProvider>
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </SnackbarProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('starts with no user and not loading', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
    });

    it('loads user from localStorage on mount', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        token: 'mock-token'
      };

      localStorage.setItem('user', JSON.stringify(mockUser));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as testuser');
      });
    });
  });

  describe('Login Functionality', () => {
    it('successfully logs in a user', async () => {
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            token: 'mock-token'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as testuser');
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        {
          email: 'test@example.com',
          password: 'password'
        }
      );
    });

    it('handles login error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });
    });

    it('stores user data in localStorage after successful login', async () => {
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            token: 'mock-token'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        expect(storedUser.username).toBe('testuser');
      });
    });
  });

  describe('Register Functionality', () => {
    it('successfully registers a user', async () => {
      const mockResponse = {
        data: {
          message: 'User registered successfully'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const registerButton = screen.getByText('Register');
      await userEvent.click(registerButton);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password'
        }
      );
    });

    it('handles registration error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'User already exists'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const registerButton = screen.getByText('Register');
      await userEvent.click(registerButton);

      // Should not change the logged-in state
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
    });
  });

  describe('Logout Functionality', () => {
    it('successfully logs out a user', async () => {
      // First login a user
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            token: 'mock-token'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as testuser');
      });

      // Then logout
      const logoutButton = screen.getByText('Logout');
      await userEvent.click(logoutButton);

      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
    });

    it('clears user data from localStorage on logout', async () => {
      // First login a user
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            token: 'mock-token'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(localStorage.getItem('user')).toBeTruthy();
      });

      // Then logout
      const logoutButton = screen.getByText('Logout');
      await userEvent.click(logoutButton);

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during login', async () => {
      // Mock a delayed response
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows loading state during registration', async () => {
      // Mock a delayed response
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const registerButton = screen.getByText('Register');
      await userEvent.click(registerButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const mockError = new Error('Network Error');
      mockedAxios.post.mockRejectedValueOnce(mockError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      // Should not crash and should remain logged out
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
    });

    it('handles malformed localStorage data gracefully', () => {
      localStorage.setItem('user', 'invalid-json');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not crash and should show not logged in
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
    });
  });

  describe('Context Provider', () => {
    it('throws error when used outside of AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });
});
