import { createTheme } from '@mui/material/styles';

const commonThemeOptions = {
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 16,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRadius: 20,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
        },
      },
    },
  },
};

const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#1d9bf0',
      dark: '#1a8cd8',
      light: '#4db8ff',
    },
    secondary: {
      main: '#7856ff',
      dark: '#5e3fd9',
      light: '#9d82ff',
    },
    success: {
      main: '#00ba7c',
    },
    error: {
      main: '#f91880',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f1419',
      secondary: '#536471',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.04)',
    '0px 2px 8px rgba(0, 0, 0, 0.06)',
    '0px 4px 12px rgba(0, 0, 0, 0.08)',
    '0px 8px 24px rgba(0, 0, 0, 0.10)',
    '0px 12px 32px rgba(0, 0, 0, 0.12)',
    '0px 16px 40px rgba(0, 0, 0, 0.14)',
    '0px 20px 48px rgba(0, 0, 0, 0.16)',
    '0px 24px 56px rgba(0, 0, 0, 0.18)',
    '0px 28px 64px rgba(0, 0, 0, 0.20)',
    ...Array(15).fill('none'),
  ] as any,
});

const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#1d9bf0',
      dark: '#1a8cd8',
      light: '#4db8ff',
    },
    secondary: {
      main: '#7856ff',
      dark: '#5e3fd9',
      light: '#9d82ff',
    },
    success: {
      main: '#00ba7c',
    },
    error: {
      main: '#f91880',
    },
    background: {
      default: '#15202b',
      paper: '#192734',
    },
    text: {
      primary: '#e7e9ea',
      secondary: '#8b98a5',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.3)',
    '0px 2px 8px rgba(0, 0, 0, 0.35)',
    '0px 4px 12px rgba(0, 0, 0, 0.40)',
    '0px 8px 24px rgba(0, 0, 0, 0.45)',
    '0px 12px 32px rgba(0, 0, 0, 0.50)',
    '0px 16px 40px rgba(0, 0, 0, 0.55)',
    '0px 20px 48px rgba(0, 0, 0, 0.60)',
    '0px 24px 56px rgba(0, 0, 0, 0.65)',
    '0px 28px 64px rgba(0, 0, 0, 0.70)',
    ...Array(15).fill('none'),
  ] as any,
});

export { lightTheme, darkTheme };
