import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  GlobalProvider,
  publishMultipleResourcesMock,
  updatePublishMock,
  showSuccess,
  showError,
  setMockBalance,
} from 'qapp-core';
import { CreateProfile } from 'src/components/CreateProfile';

vi.mock('src/components/NameSwitcher', () => ({
  NameSwitcher: () => null,
}));

vi.mock('src/utils/profileCache', () => ({
  saveProfileToCache: vi.fn(async () => {}),
}));

describe('CreateProfile embedded', () => {
  beforeEach(() => {
    publishMultipleResourcesMock.mockClear();
    updatePublishMock.mockClear();
    showSuccess.mockClear();
    showError.mockClear();
    setMockBalance(1);
  });

  it('publishes without prompting auth when name/address already present', async () => {
    const authenticateUser = vi.fn();
    render(
      <GlobalProvider
        value={{
          auth: {
            address: 'ADDR',
            name: 'alice',
            authenticateUser,
          },
          identifierOperations: {
            createSingleIdentifier: vi.fn(async () => 'profile-id'),
          },
        }}
      >
        <CreateProfile embedded />
      </GlobalProvider>
    );

    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: 'Hello world' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() => {
      expect(publishMultipleResourcesMock).toHaveBeenCalledTimes(1);
    });

    expect(updatePublishMock).toHaveBeenCalledTimes(1);
    expect(showSuccess).toHaveBeenCalled();
    expect(authenticateUser).not.toHaveBeenCalled();
  });

  it('prompts auth and aborts when no name is available after auth', async () => {
    const authenticateUser = vi.fn(async () => ({ address: 'ADDR' }));

    render(
      <GlobalProvider
        value={{
          auth: {
            authenticateUser,
          },
        }}
      >
        <CreateProfile embedded />
      </GlobalProvider>
    );

    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: 'Bio text' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() => {
      expect(authenticateUser).toHaveBeenCalledTimes(1);
    });

    expect(publishMultipleResourcesMock).not.toHaveBeenCalled();
    expect(updatePublishMock).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalled();
  });

  it('requires bio before submitting', async () => {
    render(
      <GlobalProvider
        value={{
          auth: {
            address: 'ADDR',
            name: 'alice',
          },
        }}
      >
        <CreateProfile embedded />
      </GlobalProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    expect(
      await screen.findByText(/bio is required/i)
    ).toBeInTheDocument();
    expect(publishMultipleResourcesMock).not.toHaveBeenCalled();
  });

  it('blocks creation when balance is insufficient', async () => {
    setMockBalance(0.001);

    render(
      <GlobalProvider
        value={{
          auth: {
            address: 'ADDR',
            name: 'alice',
          },
        }}
      >
        <CreateProfile embedded />
      </GlobalProvider>
    );

    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: 'Hello' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    expect(publishMultipleResourcesMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(showError).toHaveBeenCalled();
    });
  });
});
