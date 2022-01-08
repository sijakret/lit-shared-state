import serve from 'rollup-plugin-serve'

import config from './rollup.config.build.js';

config[0].plugins.push(serve('doc/dist'));
 export default [
  ...config
 ];