import { createTheme, Theme } from '@mui/material/styles';

export const getMuiTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#8ea2ff' : '#202f80',
        light: isDark ? '#c7d2fe' : '#526070',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#5eead4' : '#0f766e',
        contrastText: '#ffffff',
      },
      warning: {
        main: isDark ? '#fbbf24' : '#f59e0b',
        dark: isDark ? '#f59e0b' : '#c77700',
      },
      info: {
        main: isDark ? '#93c5fd' : '#2563eb',
        dark: isDark ? '#bfdbfe' : '#1d4ed8',
      },
      background: {
        default: isDark ? '#080d1b' : '#f6f8fc',
        paper: isDark ? '#121d35' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f5f7fb' : '#121826',
        secondary: isDark ? '#a7b4c7' : '#526070',
      },
    },
    typography: {
      fontFamily: "var(--font-sans)",
      h1: {
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
      },
      h4: {
        fontFamily: "var(--font-sans)",
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
      button: {
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '4px',
            textTransform: 'none',
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? 'var(--white)' : '#ffffff',
            color: isDark ? 'var(--ink)' : '#14181c',
            backgroundImage: 'none',
            border: isDark ? '1px solid var(--paper-line)' : '1.5px solid rgba(20, 24, 28, 0.14)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              fontFamily: "var(--font-sans)",
              fontSize: '14px',
              '& fieldset': {
                borderColor: isDark ? 'var(--paper-line)' : 'rgba(20, 24, 28, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'var(--amber)' : 'rgba(20, 24, 28, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? 'var(--amber)' : '#202f80',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-sans)",
            fontSize: '14px',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-sans)",
            fontSize: '13px',
            borderColor: isDark ? 'var(--paper-line)' : 'rgba(20, 24, 28, 0.12)',
          },
          head: {
            fontWeight: 700,
            fontSize: '12px',
            backgroundColor: isDark ? 'var(--color-bg-muted)' : 'var(--paper-dim)',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '13.5px',
            minHeight: '44px',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: '12px',
            borderRadius: '4px',
          },
        },
      },
    },
  });
};

export const muiTheme = getMuiTheme('light');

