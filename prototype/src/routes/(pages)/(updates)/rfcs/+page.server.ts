import { markdownToHtml, normalizePermalink } from '$lib/utils/functions';
import type { PageServerLoad } from './$types';

const IS_SHUTDOWN = import.meta.env.VITE_IS_SHUTDOWN === 'true';
const SHUTDOWN_DATE = new Date(import.meta.env.VITE_SHUTDOWN_DATE || '');

interface PostMetadata {
  title: string;
  tabTitle?: string;
  indexTitle: string;
  permalink?: string;
  description: string;
  videos?: Array<{ title: string; url: string }>;
  startDate?: string;
  closeDate: string;
  slug?: string;
  id?: string;
  githubUrl?: string;
  outcome: string;
  outcome_link?: string;
  // Add more metadata here
}

interface PostModule {
  metadata: PostMetadata;
}

interface ProcessedRfc extends PostMetadata {
  descriptionHtml: string;
  permalink: string;
  slug: string;
}

export const load: PageServerLoad = async () => {
  // Custom RFC entries (array)
  const customRfcs: PostMetadata[] = [
    // {
    //     title: 'Custom RFC Example 1',
    //     date: '2024-01-01',
    //     startDate: '2024-07-01',
    //     closeDate: '2024-12-31',
    //     description:'This is a custom RFC entry 1.',
    //     slug: 'custom-rfc-1' // Add slug
    // },
    // Add more custom RFCs here
    // I'm going to comment this out for now, I don't think we need to show this historically anymore -Pete 2025-11-20
    //{
    //  title: 'Exploring new ways to scale FedRAMP',
    // indexTitle: 'Exploring new ways to scale FedRAMP',
    //permalink: '/archive/2024-12-20-exploring-new-ways-to-scale-fedramp',
    //  description:
    //    'FedRAMP is in early discovery around the possibility of scaling operations with fees in the future.',
    //  startDate: '2024-12-20',
    //  closeDate: '2025-04-02',
    //  id: 'Blog'
    //}
  ];

  try {
    const modules = import.meta.glob<PostModule>('./**/+page.svelte.md');
    const posts: Partial<ProcessedRfc>[] = [];

    for (const path in modules) {
      if (path === './+page.svelte.md' || path === './+page.ts' || path === './+page.server.ts') continue;

      try {
        const module = (await modules[path]()) as PostModule;
        const postSlug = path.split('/')[2];

        if (module.metadata && postSlug) {
          const postHref = module.metadata.permalink ? normalizePermalink(module.metadata.permalink) : `/rfcs/${postSlug}`;

          posts.push({
            ...module.metadata,
            permalink: postHref,
            slug: postSlug
          });
        }
      } catch (err) {
        console.warn(`Failed to load post at ${path}:`, err);
      }
    }

    const processedCustomRfcs = customRfcs.map((rfc) => ({
      ...rfc,
      permalink: rfc.permalink || '',
      slug: rfc.slug || ''
    }));

    const allItems = [...processedCustomRfcs, ...posts] as ProcessedRfc[];

    // Process all descriptions in batch and include outcome/outcome_link if present
    const combinedMarkdown = allItems.map((item) => {
      const desc = item.description || '';
      let md = desc;
      if (item.outcome) {
        md += `\n\n**Outcome:**\n${item.outcome}`;
        if (item.outcome_link) md += ` [More information](${item.outcome_link})`;
      }
      return md;
    });

    const processedDescriptions = await Promise.all(combinedMarkdown.map((md) => markdownToHtml(md)));

    allItems.forEach((item, i) => {
      item.descriptionHtml = processedDescriptions[i];
    });

    const sortedRfcs = allItems.sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bTime - aTime || (b.slug || '').localeCompare(a.slug || '');
    });

    const currentDate = new Date();
    const dateToCheck = IS_SHUTDOWN ? SHUTDOWN_DATE : currentDate;
    const openRfcs: ProcessedRfc[] = [];
    const closedRfcs: ProcessedRfc[] = [];

    for (const rfc of sortedRfcs) {
      // Start at 0:00:00 UTC (which equals to 20:00:00 EDT the day before the start date)
      const startDate = rfc.startDate ? new Date(rfc.startDate) : null;
      // Close the next day at 12:00:00 UTC (which equals to 0:00:00 GMT+12 2 days from the close date)
      const closeDate = rfc.closeDate ? new Date(new Date(rfc.closeDate).getTime() + 36 * 60 * 60 * 1000) : null;

      const isAfterStart = !startDate || dateToCheck >= startDate;
      const isBeforeClose = !closeDate || dateToCheck <= closeDate;

      if (isAfterStart && isBeforeClose) {
        openRfcs.push(rfc);
      } else {
        closedRfcs.push(rfc);
      }
    }

    return {
      rfcs: sortedRfcs,
      openRfcs,
      closedRfcs
    };
  } catch (error) {
    console.error('RFC not found: ', error);
    return {
      rfcs: [],
      openRfcs: [],
      closedRfcs: []
    };
  }
};
