/* routes/(pages)/(updates)/+layout.server.ts */
import { resolve } from '$lib/utils/paths';
import type { LayoutServerLoad } from './$types';

interface MarkdownModule {
  metadata: {
    tabTitle: string;
    // add more metadata here
  };
  default: any;
}

const modules = import.meta.glob<MarkdownModule>([
  './**/+page.svelte.md',
  './rfcs/(rfcs)/**/+page.svelte.md',
  './notices/(notices)/**/+page.svelte.md'
]);

const noticeIds = Object.keys(modules)
  .filter((path) => path.includes('/notices/(notices)/'))
  .map((path) => {
    const parts = path.split('/');
    return parts[parts.length - 2];
  })
  .sort();

// Paths that don't contain markdown files and/or front matter
const IGNORED_ROUTES = ['event', 'events'];

export const load: LayoutServerLoad = async ({ url }) => {
  // Remove the base path from the pathname
  const pathname = url.pathname.replace(resolve('/'), '/');
  const pathSegments = pathname.split('/').filter(Boolean);

  let fullPath = pathSegments.join('/');

  const shouldIgnore = IGNORED_ROUTES.some((route) => pathSegments.includes(route));

  if (shouldIgnore) return { inUpdatesGroup: true };

  if (fullPath) {
    try {
      if (fullPath.includes('rfcs')) {
        fullPath = fullPath.replace('rfcs/', 'rfcs/(rfcs)/');
      }
      if (fullPath.includes('notices')) {
        fullPath = fullPath.replace('notices/', 'notices/(notices)/');
      }

      let prevNotice: string | undefined;
      let nextNotice: string | undefined;

      if (fullPath.includes('notices/(notices)/')) {
        const id = fullPath.split('/').pop();
        if (id) {
          const index = noticeIds.indexOf(id);
          if (index !== -1) {
            if (index > 0) prevNotice = noticeIds[index - 1];
            if (index < noticeIds.length - 1) nextNotice = noticeIds[index + 1];
          }
        }
      }

      const modulePath = `./${fullPath}/+page.svelte.md`;

      if (!(modulePath in modules)) {
        throw new Error(`Module not found: ${modulePath}`);
      }

      const post = await modules[modulePath]();

      if (!post) {
        throw new Error(`Module not found: ${modulePath}`);
      }
      const { metadata } = post;
      return {
        tabTitle: metadata.tabTitle,
        inUpdatesGroup: true,
        prevNotice,
        nextNotice
      };
    } catch (error) {
      console.warn('Post not found: ', error);
      return {
        inUpdatesGroup: true
      };
    }
  }

  return {
    inUpdatesGroup: true
  };
};
