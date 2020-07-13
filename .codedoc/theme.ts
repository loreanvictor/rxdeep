import { createTheme } from '@codedoc/core/transport';


export const theme = /*#__PURE__*/createTheme({
  light: {
    primary: '#DA1F85',
    background: '#ffffff',
    border: '#12013632',
  },
  dark: {
    primary: '#FF20A2',
    background: '#120136',
    border: '#ffffff32',
  },
  quote: {
    light: {
      background: '#ffffff',
      border: '#12013632'
    },
    dark: {
      background: '#120136',
      border: '#ffffff32'
    }
  },
  formula: {
    dark: {
      background: '#120136',
      text: '#ffffff',
      highlight: '#ffffff16',
    },
    light: {
      background: '#ffffff',
      text: '#424242',
      highlight: '#12013616',
    }
  },
  toc: {
    light: {
      background: '#ffffff',
      border: '#12013632',
    },
    dark: {
      background: '#120136',
      border: '#ffffff32',
    }
  },
  code: {
    wmbar: false,
    dark: {
      lineHover: '#180542',
      shadow: 'none',
      keyword: '#7c5ffb',
      string: '#FF20A2',
      background: '#0d0321',
    },
    light: {
      lineHover: '#180542',
      shadow: 'none',
      keyword: '#7c5ffb',
      string: '#FF20A2',
      background: '#0d0321',
    }
  }
});
