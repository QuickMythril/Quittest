import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider as JotaiProvider } from 'jotai';
import { GlobalProvider, switchNameMock, showSuccess } from 'qapp-core';
import { NameSwitcher } from 'src/components/NameSwitcher';
import { MemoryRouter } from 'react-router-dom';

describe('NameSwitcher', () => {
  beforeEach(() => {
    switchNameMock.mockClear();
    showSuccess.mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{ name: 'alice' }, { name: 'bob' }],
    })));
  });

  it('switches name on selection', async () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <JotaiProvider>
          <MemoryRouter>
            <GlobalProvider value={{ auth: { address: 'ADDR', name: 'alice' } }}>
              <NameSwitcher />
            </GlobalProvider>
          </MemoryRouter>
        </JotaiProvider>
      </ThemeProvider>
    );

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    const target = await screen.findByText('@bob');
    fireEvent.click(target);

    await waitFor(() => {
      expect(switchNameMock).toHaveBeenCalledWith('bob');
      expect(showSuccess).toHaveBeenCalled();
    });
  });
});
