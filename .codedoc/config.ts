
import { configuration, DefaultMarkdownCustomComponents } from '@codedoc/core';

import { theme } from './theme';
import { Banner } from './components/banner';

export const config = /*#__PURE__*/configuration({
  theme,
  dest: {
    namespace: '/rxdeep',
    html: 'dist',
    assets: process.env.GITHUB_BUILD === 'true' ? 'dist' : '.',
    bundle: process.env.GITHUB_BUILD === 'true' ? 'bundle' : 'dist/bundle',
    styles: process.env.GITHUB_BUILD === 'true' ? 'styles' : 'dist/styles',
  },
  page: {
    title: {
      base: 'Rxdeep'
    },
    favicon: 'favicon.ico',
    fonts: {
      text: {
        name: 'Oxygen',
        url: 'https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400&display=swap',
        fallback: 'sans-serif'
      }
    }
  },
  markdown: {
    customComponents: {
      ...DefaultMarkdownCustomComponents,
      Banner
    }
  },
  misc: {
    github: {
      user: 'loreanvictor',
      repo: 'rxdeep',
    }
  },
});
