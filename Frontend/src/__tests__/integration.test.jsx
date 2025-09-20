import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
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

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <SnackbarProvider>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </SnackbarProvider>
  </ThemeProvider>
);

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  describe('User Authentication Flow', () => {
    it('completes full user registration and login workflow', async () => {
      const user = userEvent.setup();

      // Mock successful registration
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'User registered successfully' }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to register page
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);

      // Fill registration form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test1234');
      await user.type(confirmPasswordInput, 'Test1234');

      // Submit registration
      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/register'),
          {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test1234'
          }
        );
      });

      // Mock successful login
      mockedAxios.post.mockResolvedValueOnce({
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
      });

      // Navigate to login page
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      // Fill login form
      const loginEmailInput = screen.getByLabelText(/email/i);
      const loginPasswordInput = screen.getByLabelText(/password/i);

      await user.type(loginEmailInput, 'test@example.com');
      await user.type(loginPasswordInput, 'Test1234');

      // Submit login
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          {
            email: 'test@example.com',
            password: 'Test1234'
          }
        );
      });
    });

    it('handles authentication errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock login error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to login page
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      // Fill login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit login
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sweet Management Flow', () => {
    beforeEach(() => {
      // Mock successful login
      const mockUser = {
        _id: '123',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        token: 'mock-admin-token'
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    it('completes full sweet management workflow for admin', async () => {
      const user = userEvent.setup();

      // Mock get sweets response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          sweets: [
            {
              _id: '1',
              name: 'Test Sweet',
              description: 'A test sweet',
              price: 10.99,
              category: 'Chocolate',
              imageUrl: 'https://example.com/sweet.jpg',
              quantity: 50
            }
          ]
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for sweets to load
      await waitFor(() => {
        expect(screen.getByText('Test Sweet')).toBeInTheDocument();
      });

      // Mock create sweet response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          message: 'Sweet created successfully',
          sweet: {
            _id: '2',
            name: 'New Sweet',
            description: 'A new sweet',
            price: 15.99,
            category: 'Candy',
            imageUrl: 'https://example.com/new-sweet.jpg',
            quantity: 100
          }
        }
      });

      // Navigate to admin page
      const adminLink = screen.getByText(/admin/i);
      await user.click(adminLink);

      // Fill create sweet form
      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const priceInput = screen.getByLabelText(/price/i);
      const categoryInput = screen.getByLabelText(/category/i);
      const imageUrlInput = screen.getByLabelText(/image url/i);
      const quantityInput = screen.getByLabelText(/quantity/i);

      await user.type(nameInput, 'New Sweet');
      await user.type(descriptionInput, 'A new sweet');
      await user.type(priceInput, '15.99');
      await user.type(categoryInput, 'Candy');
      await user.type(imageUrlInput, 'https://example.com/new-sweet.jpg');
      await user.type(quantityInput, '100');

      // Submit create sweet form
      const createButton = screen.getByRole('button', { name: /create sweet/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/sweets/createSweet'),
          {
            name: 'New Sweet',
            description: 'A new sweet',
            price: 15.99,
            category: 'Candy',
            imageUrl: 'https://example.com/new-sweet.jpg',
            quantity: 100
          }
        );
      });
    });

    it('handles sweet search functionality', async () => {
      const user = userEvent.setup();

      // Mock search response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          sweets: [
            {
              _id: '1',
              name: 'Chocolate Bar',
              description: 'Delicious chocolate',
              price: 5.99,
              category: 'Chocolate',
              imageUrl: 'https://example.com/chocolate.jpg',
              quantity: 50
            }
          ],
          total: 1
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to search page
      const searchLink = screen.getByText(/search/i);
      await user.click(searchLink);

      // Fill search form
      const searchInput = screen.getByPlaceholderText(/search sweets/i);
      await user.type(searchInput, 'chocolate');

      // Submit search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/sweets/searchSweet'),
          {
            params: {
              q: 'chocolate'
            }
          }
        );
      });
    });
  });

  describe('User Dashboard Flow', () => {
    beforeEach(() => {
      // Mock successful login as regular user
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        token: 'mock-user-token'
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    it('displays user dashboard with sweets', async () => {
      // Mock get sweets response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          sweets: [
            {
              _id: '1',
              name: 'Test Sweet',
              description: 'A test sweet',
              price: 10.99,
              category: 'Chocolate',
              imageUrl: 'https://example.com/sweet.jpg',
              quantity: 50
            }
          ]
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Test Sweet')).toBeInTheDocument();
      });

      // Verify user is logged in
      expect(screen.getByText(/welcome.*testuser/i)).toBeInTheDocument();
    });

    it('handles sweet purchase', async () => {
      const user = userEvent.setup();

      // Mock get sweets response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          sweets: [
            {
              _id: '1',
              name: 'Test Sweet',
              description: 'A test sweet',
              price: 10.99,
              category: 'Chocolate',
              imageUrl: 'https://example.com/sweet.jpg',
              quantity: 50
            }
          ]
        }
      });

      // Mock purchase response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          message: 'Purchase successful',
          sweet: {
            _id: '1',
            name: 'Test Sweet',
            quantity: 49
          }
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for sweets to load
      await waitFor(() => {
        expect(screen.getByText('Test Sweet')).toBeInTheDocument();
      });

      // Click purchase button
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/sweets/purchaseSweet/1'),
          {
            quantity: 1
          }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to login page
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit login
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('handles 401 errors by redirecting to login', async () => {
      // Mock 401 error
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for error handling
      await waitFor(() => {
        expect(localStorage.getItem('user')).toBeNull();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates between pages correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test navigation to different pages
      const homeLink = screen.getByText(/home/i);
      await user.click(homeLink);
      expect(screen.getByText(/welcome to sweet shop/i)).toBeInTheDocument();

      const searchLink = screen.getByText(/search/i);
      await user.click(searchLink);
      expect(screen.getByText(/search sweets/i)).toBeInTheDocument();

      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });
});
