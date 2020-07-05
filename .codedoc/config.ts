
import { configuration, DefaultMarkdownCustomComponents } from '@codedoc/core';

import { theme } from './theme';
import { Banner } from './components/banner';
import { formulaPlugin } from '@codedoc/core/components';

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
      base: 'RxDeep'
    },
    favicon: 'favicon.ico',
    fonts: {
      text: {
        name: 'Oxygen',
        url: 'https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400&display=swap',
        fallback: 'sans-serif'
      },
      code: {
        name: 'DM Mono',
        url: 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300&display=swap',
        fallback: 'monospace'
      }
    },
    meta: {
      description: 'Reactive state management using RxJS. Flexibly make changes, listen on changes on any part of the state-tree, verify changes, track change history, distribute state-tree across network, etc.',
      subject: 'Reactive state management using RxJS. Flexibly make changes, listen on changes on any part of the state-tree, verify changes, track change history, distribute state-tree across network, etc.',
      keywords: [
        'State Management',
        'Reactive',
        'RxJS',
        'State Tree',
        'Object Tree',
        'Redux'
      ]
    }
  },
  plugins: [ formulaPlugin, ],
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
