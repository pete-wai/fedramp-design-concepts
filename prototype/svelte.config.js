import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
function demoLinks() {
  return (tree) => {
    const walk = (node) => {
      if (node.tagName === 'a' && typeof node.properties?.href === 'string' && node.properties.href.startsWith('/')) {
        const href = node.properties.href;
        const route = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
        const local = ['/', '/20x', '/rfcs', '/rfcs/0025', '/marketplace', '/marketplace/products'].includes(route);
        node.properties.href = local ? base + (route === '/' ? '/' : route + '/') + href.slice(href.split(/[?#]/)[0].length) : 'https://www.fedramp.gov' + href;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
const base = process.env.BASEURL || '';
export default {
  preprocess: [vitePreprocess(), mdsvex({extensions:['.svelte.md'], rehypePlugins:[demoLinks,rehypeSlug,[rehypeAutolinkHeadings,{behavior:'append',properties:{'aria-hidden':true,tabindex:-1,class:'heading-auto-link'}}]]})],
  extensions:['.svelte','.svelte.md'],
  kit:{adapter:adapter({pages:'build',assets:'build',strict:true}),paths:{base,relative:false},prerender:{entries:['*'],handleHttpError:'warn',handleMissingId:'warn'},alias:{'@styles':'./src/styles','$styles':'./src/styles'}}
};
