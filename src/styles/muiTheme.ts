import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#14181c', // --ink
      light: '#3a4048', // --ink-soft
      contrastText: '#f8f7f2', // --white
    },
    secondary: {
      main: '#a8562f', // --rust
      contrastText: '#f8f7f2',
    },
    warning: {
      main: '#e29a3c', // --amber
      dark: '#c17d24', // --amber-deep
    },
    info: {
      main: '#3e6e8e', // --steel
      dark: '#294a60', // --steel-deep
    },
    background: {
      default: '#eceee6', // --paper
      paper: '#f8f7f2', // --white
    },
    text: {
      primary: '#14181c',
      secondary: '#3a4048',
    },
  },
  typography: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    h1: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    button: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 3,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '3px',
          textTransform: 'none',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
        },
      },
    },
  },
});
