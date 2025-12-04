import React, { FC, useEffect } from 'react';
import { ThemeProvider } from '@emotion/react';
import { lightTheme, darkTheme } from './theme';
import { CssBaseline } from '@mui/material';
import { EnumTheme, themeAtom } from '../../state/global/system';
import { useAtom } from 'jotai';

interface ThemeProviderWrapperProps {
  children: React.ReactNode;
}

const ThemeProviderWrapper: FC<ThemeProviderWrapperProps> = ({ children }) => {
  const [theme] = useAtom(themeAtom);

  // Set data-theme attribute on document root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme === EnumTheme.LIGHT ? 'light' : 'dark'
    );
  }, [theme]);

  return (
    <ThemeProvider theme={theme === EnumTheme.LIGHT ? lightTheme : darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;
