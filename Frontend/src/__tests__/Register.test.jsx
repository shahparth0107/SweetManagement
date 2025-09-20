import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';

test('renders Register form and submits', () => {
  render(
    <SnackbarProvider>
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    </SnackbarProvider>
  );
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});