
 import resolve from '@rollup/plugin-node-resolve';
 import copy from 'rollup-plugin-copy';
 import esbuild from 'rollup-plugin-esbuild'
 import {importMetaAssets} from '@web/rollup-plugin-import-meta-assets';
 import html from '@web/rollup-plugin-html';
 import markdown from '@jackfranklin/rollup-plugin-markdown'
 import highlight from 'showdown-highlight';
 import replace from '@rollup/plugin-replace';
 import { version } from '../package.json';

 const h = highlight({});
 export default [
   {
     input: 'doc/index.html',
     output: {
       dir: 'doc/dist',
       format: 'esm',
     },
     plugins: [
       html(),
       resolve(),
       markdown({
        showdownOptions: {
          simpleLineBreaks: false,
          extensions: [h]
         }
       }),
       replace({
        __VERSION__: () => JSON.stringify(version),
      }),
       esbuild(),
       importMetaAssets(),
       copy({
         targets: [
          {
            src: 'doc/samples/**',
            dest: 'doc/dist/samples/',
          },
          {
            src: 'doc/lit-shared-state.ts',
            dest: 'doc/dist/',
          },
          {
            src: 'doc/api/**',
            dest: 'doc/dist/api',
          },
         ],
       })
     ],
   },
 ];