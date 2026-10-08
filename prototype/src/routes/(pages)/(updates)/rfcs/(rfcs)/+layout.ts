import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  try {
    // Extract slug from the URL path
    const pathSegments = url.pathname.split('/');
    const rfcsIndex = pathSegments.indexOf('rfcs');
    const slug = pathSegments[rfcsIndex + 1];

    if (!slug) {
      return { metadata: {} };
    }

    // Dynamically import the specific RFC markdown file
    const module = await import(`./${slug}/+page.svelte.md`);

    if (module?.metadata) {
      return {
        metadata: module.metadata
      };
    }

    return {
      metadata: {}
    };
  } catch (error) {
    console.error(`Failed to load RFC metadata:`, error);
    return {
      metadata: {}
    };
  }
};
