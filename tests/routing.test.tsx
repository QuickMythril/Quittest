import React from 'react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from 'src/App';
import { AppWrapper } from 'src/AppWrapper';
import { Routes as RoutesComponent } from 'src/routes/Routes';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createBrowserRouter: vi.fn(() => ({} as any)),
    RouterProvider: () => <div data-testid="router-provider" />,
  };
});

vi.mock('src/components/SocialApp', () => ({
  SocialApp: () => <div data-testid="social-app" />,
}));

vi.mock('src/styles/Layout', () => ({
  default: () => <div data-testid="layout" />,
}));

describe('Routing/App wrappers', () => {
  it('renders App with SocialApp', () => {
    render(<App />);
    expect(screen.getByTestId('social-app')).toBeInTheDocument();
  });

  it('renders AppWrapper with Layout', () => {
    render(<AppWrapper />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('Routes renders RouterProvider', () => {
    render(<RoutesComponent />);
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
  });
});
