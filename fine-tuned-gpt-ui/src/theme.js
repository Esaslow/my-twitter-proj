// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7e22ce', // deep purple for a futuristic vibe
    },
    secondary: {
      main: '#d946ef',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#bbbbbb',
    },
  },
  typography: {
    fontFamily: ['Orbitron', 'sans-serif'].join(','),
  },
  // You can extend more properties here if needed.
});

export default theme;
