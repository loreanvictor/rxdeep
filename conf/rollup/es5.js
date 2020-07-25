import babel from '@rollup/plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import base from './base';


export default Object.assign(base, {
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ["@babel/preset-env"],
    }),
    uglify(),
    nodeResolve(),
  ],
  output: Object.assign(base.output, {
    file: 'dist/bundles/rxdeep.es5.min.js',
  }),
});
