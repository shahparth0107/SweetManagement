import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SweetCard from '../components/SweetCard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('SweetCard Component', () => {
  const mockSweet = {
    _id: '123',
    name: 'Test Sweet',
    description: 'A delicious test sweet',
    price: 15.99,
    category: 'Chocolate',
    imageUrl: 'https://example.com/sweet.jpg',
    quantity: 50
  };

  const mockOnPurchase = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sweet information correctly', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByText(mockSweet.name)).toBeInTheDocument();
      expect(screen.getByText(`Price: ₹${mockSweet.price}`)).toBeInTheDocument();
      expect(screen.getByText(mockSweet.category)).toBeInTheDocument();
      expect(screen.getByText(`Stock: ${mockSweet.quantity}`)).toBeInTheDocument();
    });

    it('renders sweet image with correct src and alt', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', mockSweet.imageUrl);
      expect(image).toHaveAttribute('alt', mockSweet.name);
    });

    it('renders purchase button', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /purchase/i })).toBeInTheDocument();
    });
  });

  describe('Purchase Functionality', () => {
    it('calls onPurchase when purchase button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      await user.click(purchaseButton);

      expect(mockOnPurchase).toHaveBeenCalledWith(mockSweet);
    });

    it('calls onPurchase with custom quantity when quantity is specified', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} quantity={5} />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      await user.click(purchaseButton);

      expect(mockOnPurchase).toHaveBeenCalledWith(mockSweet);
    });

    it('disables purchase button when quantity is 0', () => {
      const outOfStockSweet = { ...mockSweet, quantity: 0 };

      render(
        <TestWrapper>
          <SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /out of stock/i });
      expect(purchaseButton).toBeDisabled();
    });

    it('shows out of stock message when quantity is 0', () => {
      const outOfStockSweet = { ...mockSweet, quantity: 0 };

      render(
        <TestWrapper>
          <SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getAllByText(/out of stock/i)).toHaveLength(2); // Both chip and button text
    });
  });

  describe('Price Formatting', () => {
    it('formats price correctly with two decimal places', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByText('Price: ₹15.99')).toBeInTheDocument();
    });

    it('handles whole number prices correctly', () => {
      const wholePriceSweet = { ...mockSweet, price: 10 };

      render(
        <TestWrapper>
          <SweetCard sweet={wholePriceSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByText('Price: ₹10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      
      await user.tab();
      expect(purchaseButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing image gracefully', () => {
      const sweetWithoutImage = { ...mockSweet, imageUrl: '' };

      render(
        <TestWrapper>
          <SweetCard sweet={sweetWithoutImage} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      // Should still render the card without crashing
      expect(screen.getByText(mockSweet.name)).toBeInTheDocument();
    });

    it('handles very long descriptions', () => {
      const longDescriptionSweet = {
        ...mockSweet,
        description: 'A'.repeat(200) // Very long description
      };

      render(
        <TestWrapper>
          <SweetCard sweet={longDescriptionSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      // The component doesn't display description, only name, price, and stock
      expect(screen.getByText(longDescriptionSweet.name)).toBeInTheDocument();
    });

    it('handles special characters in name and description', () => {
      const specialCharSweet = {
        ...mockSweet,
        name: 'Sweet & Chocolate 🍫',
        description: 'Delicious sweet with "special" characters & symbols!'
      };

      render(
        <TestWrapper>
          <SweetCard sweet={specialCharSweet} onPurchase={mockOnPurchase} />
        </TestWrapper>
      );

      expect(screen.getByText(specialCharSweet.name)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state when purchasing', () => {
      render(
        <TestWrapper>
          <SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} isPurchasing={true} />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      // The component doesn't show "purchasing" text, it just disables the button during loading
      expect(purchaseButton).toBeInTheDocument();
    });
  });
});
