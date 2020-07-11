import { createTheme } from '@codedoc/core/transport';


export const theme = /*#__PURE__*/createTheme({
  light: {
    primary: '#DA1F85',
    background: '#ffffff',
    border: '#24166332',
  },
  dark: {
    primary: '#FF20A2',
    background: '#241663',
    border: '#ffffff32',
  },
  quote: {
    light: {
      background: '#ffffff',
      border: '#24166332'
    },
    dark: {
      background: '#241663',
      border: '#ffffff32'
    }
  },
  formula: {
    dark: {
      background: '#241663',
      text: '#ffffff',
      highlight: '#ffffff16',
    },
    light: {
      background: '#ffffff',
      text: '#424242',
      highlight: '#24166316',
    }
  },
  toc: {
    light: {
      background: '#ffffff',
      border: '#24166332',
    },
    dark: {
      background: '#241663',
      border: '#ffffff32',
    }
  },
  code: {
    wmbar: false,
    dark: {
      shadow: 'none',
      keyword: '#7c5ffb',
      string: '#FF20A2',
      background: '#160f30',
    },
    light: {
      shadow: 'none',
      keyword: '#7c5ffb',
      string: '#FF20A2',
      background: '#160f30',
    }
  }
});
