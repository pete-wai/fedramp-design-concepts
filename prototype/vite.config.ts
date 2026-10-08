import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import autoprefixer from 'autoprefixer';
export default defineConfig({
  plugins:[sveltekit()],
  resolve:{alias:[
    {find:/^@uswds\/uswds\/js\/usa-accordion$/,replacement:path.resolve('node_modules/@uswds/uswds/packages/usa-accordion/src/index.js')},
    {find:'@uswds/uswds',replacement:path.resolve('node_modules/@uswds/uswds')}
  ]},
  css:{preprocessorOptions:{scss:{loadPaths:['node_modules','src/styles','node_modules/@uswds/uswds/packages','node_modules/@uswds/uswds'],api:'modern-compiler',quietDeps:true,silenceDeprecations:['import']}},postcss:{plugins:[autoprefixer()]}},
  ssr:{noExternal:['@uswds/uswds']},optimizeDeps:{exclude:['@uswds/uswds']}
});
