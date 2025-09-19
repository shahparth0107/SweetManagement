import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7B3FE4' },
    secondary: { main: '#FF7A59' }
  },
  shape: { borderRadius: 12 },
});

export default theme;
