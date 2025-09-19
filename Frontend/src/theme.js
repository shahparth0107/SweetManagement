import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7B3FE4' },
    secondary: { main: '#FF7A59' }
  },
  shape: { borderRadius: 12 },
});
theme = responsiveFontSizes(theme);

export default theme;
