import React from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hello from '../Hello';

test('renders hello world', () => {
  render(<Hello />);
  const linkElement = screen.getByText(/hello world/i);
  expect(linkElement).toBeInTheDocument();
});