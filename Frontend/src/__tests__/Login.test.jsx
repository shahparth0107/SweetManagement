import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('renders login form with all required elements', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('renders login form with proper input types', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Interaction', () => {
    it('allows user to type in email and password fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);
      
      // Check for validation messages
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            token: 'mock-token'
          }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        {
          email: 'test@example.com',
          password: 'password123'
        }
      );
    });

    it('handles login success and navigates to dashboard', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            _id: '123',
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            token: 'mock-token'
          }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles login error and shows error message', async () => {
      const user = userEvent.setup();
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
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('handles network error gracefully', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Network Error');
      
      mockedAxios.post.mockRejectedValueOnce(mockError);
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      // Check for loading state
      expect(loginButton).toBeDisabled();
      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to register page when register link is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and accessibility attributes', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(loginButton).toHaveAttribute('type', 'submit');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Tab navigation
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(loginButton).toHaveFocus();
    });
  });
});