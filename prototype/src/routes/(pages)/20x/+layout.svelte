<script lang="ts">
  import type { Snippet } from 'svelte';
  import USAInPageNav from '$lib/components/USAInPageNav.svelte';

  interface LayoutProps {
    data: {
      tabTitle?: string;
    };
    children: Snippet;
  }

  const sectionHeadings = [
    { id: 'overview', text: 'Overview', href: '#overview', level: 2 },
    { id: 'available-now', text: 'Available Now', href: '#available-now', level: 2 },
    { id: 'core-principles', text: 'Core Principles', href: '#core-principles', level: 2 },
    { id: 'context-matters', text: 'Context Matters', href: '#context-matters', level: 2 },
    { id: 'phased-implementation', text: 'Phased Implementation', href: '#phased-implementation', level: 2 },
    { id: 'timeline', text: 'Timeline', href: '#timeline', level: 2 },
    { id: 'lets-go', text: "Let's Go!", href: '#lets-go', level: 2 }
  ];

  let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>{data.tabTitle ?? 'FedRAMP 20x'}</title>
</svelte:head>

<div class="twentyx-dark twentyx-outer">
  <div class="twentyx-layout">
    <main id="main-content" class="twentyx-main">
      {@render children()}
    </main>
    <aside class="twentyx-aside" aria-label="FedRAMP 20x page navigation">
      <USAInPageNav headings={sectionHeadings} title="On this page" headingSelector="h2" scrollOffset="32" />
    </aside>
  </div>
</div>

<style lang="scss">
  .twentyx-dark {
    --tx-bg: #0f0a14;
    --tx-surface: #1e1226;
    --tx-surface-raised: #2a1a35;
    --tx-border: #3d2850;
    --tx-border-strong: #68477f;
    --tx-text-primary: #f0e8f5;
    --tx-text-secondary: #b79bc7;
    --tx-accent-warm: #ff9248;
    --tx-accent-warm-light: #ffc08e;
    --tx-accent-cool: #c4a0e8;
    --tx-status-completed: #b7bdc8;
    --tx-status-active: #75d99e;
    --tx-status-future: #5d5d70;
    --tx-timeline-future: #777789;
    --tx-future-text: #a3a3b2;
    --tx-font-sans: 'Public Sans Web', 'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    --tx-font-mono: 'Roboto Mono Web', 'Roboto Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
    color-scheme: dark;
    font-family: var(--tx-font-sans);
  }

  .twentyx-outer {
    min-height: 100vh;
    background:
      radial-gradient(circle at 16% 10%, rgba(117, 38, 96, 0.2), transparent 30rem),
      radial-gradient(circle at 80% 42%, rgba(73, 28, 61, 0.18), transparent 34rem), var(--tx-bg);
    color: var(--tx-text-primary);
  }

  .twentyx-layout {
    display: grid;
    max-width: 1440px;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 3.5rem) 6rem;
    grid-template-areas: 'main aside';
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: clamp(2rem, 5vw, 4.5rem);
    align-items: start;
  }

  .twentyx-main {
    min-width: 0;
    grid-area: main;
  }

  .twentyx-aside {
    position: sticky;
    top: 1.5rem;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
    grid-area: aside;
  }

  .twentyx-aside :global(.usa-in-page-nav) {
    width: 100%;
    margin: 0;
    padding: 0.35rem 0 0.35rem 1rem;
    border: 0;
    border-left: 1px solid var(--tx-border);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .twentyx-aside :global(.usa-in-page-nav__heading) {
    margin: 0 0 0.8rem;
    color: var(--tx-text-secondary);
    font-family: var(--tx-font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .twentyx-aside :global(.usa-in-page-nav__list) {
    border: 0;
  }

  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button)),
  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button):visited) {
    color: var(--tx-text-secondary);
    font-size: 0.8rem;
    font-weight: 550;
    line-height: 1.35;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button):hover),
  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button):active),
  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button).usa-current) {
    color: var(--tx-accent-warm-light);
  }

  .twentyx-aside :global(.usa-in-page-nav__list a:not(.usa-button).usa-current::after) {
    left: -1.05rem;
    width: 3px;
    background-color: var(--tx-accent-warm);
  }

  @media (max-width: 1050px) {
    .twentyx-layout {
      grid-template-areas: 'main';
      grid-template-columns: minmax(0, 1fr);
    }

    .twentyx-aside {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .twentyx-layout {
      padding-top: 1rem;
      padding-right: 0;
      padding-left: 0;
    }

    .twentyx-main {
      padding: 0 1rem;
    }
  }
</style>
