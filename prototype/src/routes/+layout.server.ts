/* routes/+layout.server.ts */
export const prerender = true;
// export const ssr = false;
export const trailingSlash = 'always';
import { resolve, asset } from '$lib/utils/paths';

export function load({ url }) {
  const pathname = url.pathname;
  const normalizedPathName = pathname.replace(resolve('/'), '/');


  const menuItems = [
    {
      id: 'community-updates',
      text: 'Community & Updates',
      children: [
        { id: 'changelog', text: 'Changelog', href: '/changelog/' },
        { id: 'blog', text: 'Blog', href: '/blog/1/' },
        { id: 'events', text: 'Events', href: '/events/' },
        { id: 'cwg', text: 'Community Updates', href: '/community/' },
        { id: 'notices', text: 'Public Notices', href: '/notices/' },
        { id: 'rfcs', text: 'Requests For Comment', href: '/rfcs/' }
      ]
    },
    {
      id: 'rules',
      text: 'Rules & Requirements',
      children: [
        { id: '2026', text: 'Consolidated Rules for 2026', href: '/2026/', reload: true },
        { id: 'legacy', text: 'Legacy Documentation Reference', href: '/legacy/', reload: true }
      ]
    },
    {
      id: '20x',
      text: 'FedRAMP 20x',
      href: '/20x'
    },
    {
      id: 'marketplace',
      text: 'Marketplace',
      href: '/marketplace'
    }
  ];

  const projectInfo = {
    href: resolve('/'),
    logo: { src: asset('/fedramp-logo-vert.svg'), alt: 'FedRAMP' }
  };

  const search = {
    enabled: true,
    action: 'https://search.usa.gov/search',
    placeholder: 'Search',
    buttonText: 'Search'
  };

  const heroBannerValues = {
    blog: {
      heroBannerHeading: 'Focus on FedRAMP® Blog',
      heroBannerText: 'Discover what’s happening in the FedRAMP world.',
      heroBannerClass: 'fedramp-basic-hero-banner'
    },
    updates: {
      changelog: {
        heroBannerHeading: 'FedRAMP Updates Changelog',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      events: {
        heroBannerHeading: 'FedRAMP Events',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      community: {
        heroBannerHeading: 'FedRAMP Community Updates',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      disclaimers: {
        heroBannerHeading: 'FedRAMP Disclaimers',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      docs: {
        heroBannerHeading: 'FedRAMP Docs',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      governance: {
        heroBannerHeading: 'FedRAMP Governance',
        heroBannerText:
          'The Federal Risk and Authorization Management Program operates in a complex matrix of shared or distributed responsibilities across the federal government. Learn more about who is involved, their responsibilities, and how they interact with FedRAMP.',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      rfcs: {
        heroBannerHeading: 'Requests for Comment',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      scope: {
        heroBannerHeading: 'Scope of FedRAMP',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      shutdown: {
        heroBannerHeading: 'FedRAMP During Government Shutdown',
        heroBannerClass: 'fedramp-basic-hero-banner'
      }
    },
    rev5: {
      documents: {
        heroBannerHeading: 'FedRAMP Documents & Templates',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      stakeholders: {
        heroBannerHeading: 'FedRAMP Stakeholders',
        heroBannerClass: 'fedramp-basic-hero-banner'
      }
    },
    schemas: {
      list: {
        heroBannerHeading: 'FedRAMP JSON Schemas',
        heroBannerClass: 'fedramp-basic-hero-banner'
      },
      validator: {
        heroBannerHeading: 'JSON Schema Validator',
        heroBannerClass: 'fedramp-basic-hero-banner'
      }
    },
    brand: {
      heroBannerHeading: 'FedRAMP Brand Guide',
      heroBannerClass: 'fedramp-basic-hero-banner'
    }
  };

  return {
    menuItems,
    projectInfo,
    search,
    heroBannerValues
  };
}
