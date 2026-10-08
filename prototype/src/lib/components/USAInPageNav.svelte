<!-- lib/components/USAInPageNav.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { ClassValue } from 'svelte/elements';

  interface Heading {
    id: string;
    text: string;
    href: string;
    level?: number;
  }

  interface Child {
    text: string;
  }

  type Props = {
    class?: ClassValue;
    title?: string;
    headings?: Heading[];
    customChildren?: Child[];
    autoGenerate?: boolean;
    titleLevel?: string;
    headingSelector?: string;
    scrollOffset?: string;
    rootMargin?: string;
    threshold?: string;
  };

  let {
    title = 'On this page',
    class: className = '',
    headings = [],
    customChildren: itemChildren = [],
    autoGenerate = false,
    titleLevel = 'h4',
    headingSelector = 'h2, h3',
    scrollOffset = '0',
    rootMargin = '0px 0px 0px 0px',
    threshold = '1'
  }: Props = $props();

  let generatedHeadings = $state<Heading[]>([]);
  let mounted = $state(false);
  let currentSection = $state<string>('');
  let isScrollingFromClick = $state(false);

  let showBorder = $state(false);
  let navOriginalTop = $state(0);
  let finalHeadings = $derived(autoGenerate ? generatedHeadings : headings);

  // offset calculation
  function getScrollOffset() {
    return window.innerWidth <= 639 ? 80 : parseInt(scrollOffset) || 10;
  }

  function generateHeadings() {
    if (!autoGenerate || !mounted) return;

    setTimeout(() => {
      const pageHeadings = document.querySelectorAll(headingSelector);
      generatedHeadings = Array.from(pageHeadings).map((heading) => {
        const text = heading.textContent?.trim() || '';
        const id =
          heading.id ||
          text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();

        if (!heading.id) {
          heading.id = id;
        }

        const level = parseInt(heading.tagName.substring(1));

        return {
          id,
          text,
          href: `#${id}`,
          level
        };
      });
    }, 100);
  }

  function syncScrollPosition() {
    if (window.innerWidth <= 639) {
      requestAnimationFrame(() => {
        const currentLink = document.querySelector(`.usa-in-page-nav__link[href="#${currentSection}"]`) as HTMLElement;
        const navContainer = document.querySelector('.mobile\\:usa-in-page-nav, [class*="mobile:usa-in-page-nav"], .usa-in-page-nav') as HTMLElement;

        if (currentLink && navContainer) {
          const containerRect = navContainer.getBoundingClientRect();
          const linkRect = currentLink.getBoundingClientRect();
          const currentScrollLeft = navContainer.scrollLeft;
          const linkRelativeLeft = linkRect.left - containerRect.left + currentScrollLeft;
          const linkWidth = linkRect.width;
          const containerWidth = containerRect.width;
          const idealScrollLeft = linkRelativeLeft - containerWidth / 2 + linkWidth / 2;
          const maxScrollLeft = navContainer.scrollWidth - containerWidth;
          const finalScrollLeft = Math.max(0, Math.min(idealScrollLeft, maxScrollLeft));

          navContainer.scrollTo({
            left: finalScrollLeft,
            behavior: 'smooth'
          });
        }
      });
    }
  }

  function observeHeading() {
    function updateCurrentSection() {
      if (isScrollingFromClick) return;

      const validIds = new Set(finalHeadings.map((h) => h.id));

      const allHeadings = Array.from(document.querySelectorAll(headingSelector)).filter(
        (h) => !h.closest('.usa-in-page-nav') && validIds.has((h as HTMLElement).id)
      ) as HTMLElement[];

      if (allHeadings.length === 0) return;

      const scrollTop = window.scrollY;
      const buffer = getScrollOffset() + 48;
      const atBottom = window.innerHeight + scrollTop >= document.documentElement.scrollHeight - 200;

      if (atBottom) {
        const lastHeading = allHeadings[allHeadings.length - 1];
        const newSection = lastHeading?.id ?? '';
        if (newSection !== currentSection) {
          currentSection = newSection;
          syncScrollPosition();
        }
        return;
      }

      let activeIndex = -1;

      for (let i = 0; i < allHeadings.length; i++) {
        const headingTop = allHeadings[i].getBoundingClientRect().top + scrollTop;
        if (headingTop <= scrollTop + buffer) {
          activeIndex = i;
        } else {
          break;
        }
      }

      const newSection = activeIndex >= 0 ? (allHeadings[activeIndex].id ?? '') : '';

      if (newSection !== currentSection) {
        currentSection = newSection;
        syncScrollPosition();
      }
    }

    function handleScroll() {
      requestAnimationFrame(updateCurrentSection);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateCurrentSection();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }

  function trackNavPosition() {
    const nav = document.querySelector('.mobile\\:usa-in-page-nav, .usa-in-page-nav') as HTMLElement;
    if (nav && window.innerWidth <= 639) {
      navOriginalTop = nav.offsetTop;
    }

    function handleScroll() {
      if (window.innerWidth <= 639) {
        showBorder = window.scrollY >= navOriginalTop;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }

  function handleAnchorClick(href: string, event: Event) {
    event.preventDefault();
    const anchorId = href.replace('#', '');
    const anchor = document.querySelector(`h2[id="${anchorId}"], h3[id="${anchorId}"], h4[id="${anchorId}"]`);

    if (anchor) {
      const offset = getScrollOffset();

      isScrollingFromClick = true;
      currentSection = anchorId;

      window.scrollTo({
        top: anchor.getBoundingClientRect().top + window.pageYOffset - offset,
        behavior: 'smooth'
      });

      syncScrollPosition();

      setTimeout(() => {
        isScrollingFromClick = false;
      }, 1000);
    }
  }

  onMount(() => {
    mounted = true;
    generateHeadings();

    function handleResize() {
      setTimeout(() => {
        syncScrollPosition();
        const nav = document.querySelector('.mobile\\:usa-in-page-nav, .usa-in-page-nav') as HTMLElement;
        if (nav && window.innerWidth <= 639) {
          navOriginalTop = nav.offsetTop;
        }
      }, 100);
    }

    window.addEventListener('resize', handleResize);

    setTimeout(() => {
      const cleanupHeadings = observeHeading();
      const cleanupNav = trackNavPosition();
      syncScrollPosition();

      return () => {
        cleanupHeadings();
        cleanupNav();
        window.removeEventListener('resize', handleResize);
      };
    }, 150);
  });

  $effect(() => {
    void $page.url;
    generateHeadings();
  });
</script>

<aside
  class={`usa-in-page-nav ${className} ${showBorder ? 'show-border' : ''}`}
  data-title-text={title}
  data-title-heading-level={titleLevel}
  data-scroll-offset={scrollOffset}
  data-root-margin={rootMargin}
  data-threshold={threshold}
  data-auto-generate={autoGenerate}
>
  <nav aria-label={title} class="usa-in-page-nav__nav">
    <svelte:element this={titleLevel} class="usa-in-page-nav__heading">{title}</svelte:element>
    <ul class="usa-in-page-nav__list">
      {#each finalHeadings as heading, i (heading.id)}
        <li class="usa-in-page-nav__item">
          <a
            class="usa-in-page-nav__link {currentSection === heading.id ? 'usa-current' : ''} {(heading.level || 2) === 2
              ? 'heading-level-2'
              : 'heading-level-3'}"
            href={heading.href}
            onclick={(event) => handleAnchorClick(heading.href, event)}
          >
            {#if itemChildren[i] && itemChildren.length > 0}
              {itemChildren[i].text}
            {:else}
              {heading.text}
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</aside>

<style lang="scss">
  // Custom colors
  .usa-in-page-nav__nav {
    .usa-in-page-nav__list {
      border-left: 1px solid #dfe1e2;
    }
    background-color: transparent;
  }

  .usa-in-page-nav__heading {
    color: #1b1121;
  }

  .usa-in-page-nav__list a:not(.usa-button):not(.usa-current):visited,
  .usa-in-page-nav__list a:not(.usa-button):not(.usa-current) {
    color: #543669;
  }

  .usa-in-page-nav__list a:not(.usa-button).usa-current::after {
    background-color: #ce4929;
  }

  .usa-in-page-nav__list a:not(.usa-button):not(.usa-current):hover,
  .usa-in-page-nav__list a:not(.usa-button):not(.usa-current):active {
    color: #f5b755;
  }

  .usa-in-page-nav__list a:not(.usa-button).usa-current {
    color: #1b1121;
  }

  .usa-in-page-nav__list a.heading-level-2,
  .usa-in-page-nav__list a.heading-level-2.usa-current {
    font-weight: 700;
  }

  .usa-in-page-nav__list a.heading-level-3,
  .usa-in-page-nav__list a.heading-level-3.usa-current {
    font-weight: 400;
  }

  // Desktop styling
  @media (min-width: 640px) {
    .mobile\:usa-in-page-nav {
      display: none;
    }
  }

  // Mobile styling
  @media (max-width: 639.99px) {
    .mobile\:usa-in-page-nav {
      width: 100%;
      max-width: 100%;
      display: flex;
      margin-left: 0;
      margin-top: 0;
      position: sticky;
      order: 0;
      top: 0;
      z-index: 100;
      background-color: #f5f5fa;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      border-bottom: 1px solid transparent;
      transition: border-bottom-color 0.5s ease-in-out;

      .usa-in-page-nav__list {
        border: none;
      }

      &::-webkit-scrollbar {
        width: 0px;
        height: 0px;
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: transparent;
      }

      &.show-border {
        border-bottom-color: #b6aabe;
      }

      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .usa-in-page-nav__nav {
      width: 100%;
      min-width: 100%;
    }

    .usa-in-page-nav__list {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 0;
      border-left: none;
      margin: 0;
      padding: 0.5rem 0;
      width: max-content;
      min-width: 100%;

      &:last-child {
        padding-right: 2rem;
      }
    }

    .usa-in-page-nav__item {
      flex: 0 0 auto;
      list-style: none;
      white-space: nowrap;
    }

    .usa-in-page-nav__link {
      display: block;
      padding: 0.5rem 1rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      min-width: max-content;
    }

    .usa-in-page-nav__heading {
      display: none;
    }

    .usa-in-page-nav__list a:not(.usa-button).usa-current {
      background-color: #ce4929;
      border-radius: 10px;
      color: #f5f5fa;
      font-weight: 700;
      transition:
        background-color 0.3s ease-in-out,
        opacity 0.3s ease-in-out;
    }

    .usa-in-page-nav__list a:not(.usa-button).usa-current::after {
      display: none;
    }
  }
</style>
