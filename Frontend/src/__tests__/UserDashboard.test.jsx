import React from 'react';
import { render, screen } from '@testing-library/react';
import UserDashboard from '../pages/UserDashboard';
import { SnackbarProvider } from 'notistack';

test('renders UserDashboard title', () => {
  render(
    <SnackbarProvider>
      <UserDashboard />
    </SnackbarProvider>
  );
  expect(screen.getByText(/browse sweets/i)).toBeInTheDocument();
});