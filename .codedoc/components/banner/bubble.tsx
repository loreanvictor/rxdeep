import { ThemedComponentThis, themedStyle } from '@connectv/jss-theme';
import { RendererLike } from '@connectv/html';
import { CodedocTheme } from '@codedoc/core';
import color from 'color';


export interface BubbleOptions {
  radius: number,
  x: number,
  z?: number,
  duration: number,
  start?: number,
}


const BubbleStyle = themedStyle<CodedocTheme>(theme => ({
  bubble: {
    position: 'absolute',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    bottom: 0,
    opacity: 0,
    border: `6px solid ${color(theme.dark.background).alpha(.08).toString()}`,
    animation: '$bubble-motion 8s ease-in infinite',
    'body.dark &': {borderColor: color(theme.light.background).alpha(.08).toString()},
    '@media (prefers-color-scheme: dark)': {
      'body:not(.dark-mode-animate) &': {
        borderColor: color(theme.light.background).alpha(.1).toString()
      }
    },
  },

  '@keyframes bubble-motion': {
    '0%': { transform: 'translateY(0) scale(.5)', opacity: 0 },
    '10%': { opacity: 1, },
    '50%': { transform: 'translateY(-125vh) scale(1)', opacity: 1 },
    '100%': { transform: 'translateY(-125vh) scale(1)', opacity: 1 },
  },
}));


export function Bubble(
  this: ThemedComponentThis<CodedocTheme>,
  options: BubbleOptions,
  renderer: RendererLike<any, any>,
) {
  const classes = this.theme.classes(BubbleStyle);
  return <div class={classes.bubble} style={`
    left: ${options.x}%; z-index: ${options.z || '-1'};
    border-radius: ${options.radius}px; width: ${options.radius}px; height: ${options.radius}px;
    margin-left: -${options.radius/2}px;
    animation-duration: ${options.duration}s; animation-delay: ${options.start || '0'}s
  `}></div>
}