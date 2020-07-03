import { themedStyle } from '@connectv/jss-theme';
import { CodedocTheme } from '@codedoc/core';


export const BannerStyle = themedStyle<CodedocTheme>(theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  content: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 360,
    margin: 80,

    '@media screen and (max-width: 640px)': {
      flexDirection: 'row-reverse',
      margin: 24,
    },
  },

  octo: {
    marginRight: 56,
    animation: '$octo-float 8s ease-in-out infinite',
    position: 'relative',
    '& img': {maxWidth: '100%'},

    '@media screen and (max-width: 640px)': {
      marginRight: 0,
      marginLeft: 32,
    },
  },

  '@keyframes octo-float': {
    '0%': { transform: 'translateY(8px)' },
    '50%': { transform: 'translateY(-8px)' },
    '100%': {transform: 'translateY(8px)' },
  },

  octoLight: {
    position: 'absolute',
    left: 0, right: 0, top: '-12%',
    opacity: 0,
    transformOrigin: 'center',
    animation: '$octo-light-flicker 3s ease-in-out infinite',
    'body.dark &': {opacity: 1},
    '@media (prefers-color-scheme: dark)': {
      'body:not(.dark-mode-animate) &': {
        opacity: 1,
      }
    }
  },

  '@keyframes octo-light-flicker': {
    '0%': { transform: 'scale(.9)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(.9)' }
  },

  text: {
    width: 200,
    flexShrink: 0,

    '@media screen and (max-width: 400px)': {
      width: 156,
    },
  }
}));