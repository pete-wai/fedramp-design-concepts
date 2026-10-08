<!-- lib/components/USAHeader.svelte -->
<script lang="ts">
  import { setContext, tick, type Snippet } from 'svelte';
  import MenuItem from '../partials/MenuItem.svelte';
  // import searchIcon from '@uswds/uswds/dist/img/usa-icons-bg/search--black.svg';
  
  import type { MenuItemType } from '../types/menu-item.ts';
  import { asset, resolve } from '$lib/utils/paths';
  import { afterNavigate } from '$app/navigation';

  interface ImageInfo {
    src: string;
    alt: string;
  }

  interface ProjectInfo {
    text?: string;
    href: string;
    logo?: ImageInfo;
    customMarkup?: string;
  }

  interface LinkInfo {
    text: string;
    href: string;
  }

  interface SearchInfo {
    enabled: boolean;
    action: string;
    placeholder?: string;
    buttonText: string;
  }

  type Props = {
    kind: 'basic' | 'extended';
    projectInfo: ProjectInfo;
    menuItems: MenuItemType[];
    secondaryLinks?: LinkInfo[];
    search: SearchInfo;
    logoSnippet?: Snippet;
  };

  // Props
  let {
    // Configuration for basic or extended header
    kind = 'basic',
    // Project title/logo configuration
    projectInfo = {
      href: '/',
      text: undefined,
      logo: undefined
    },
    // Navigation items configuration
    menuItems = [],
    // Secondary navigation links (top right)
    secondaryLinks = [],
    // Search configuration
    search = {
      enabled: false,
      action: 'https://search.usa.gov/search',
      placeholder: 'Search',
      buttonText: 'Search'
    },
    logoSnippet
  }: Props = $props();

  let identifiedMenuItems = $derived(menuItems.map((item, index) => ({ ...item, id: item.id || `menu-item-${index}` })));
  let menuButton: HTMLButtonElement;
  let mobileNavigation: HTMLElement;
  let closeButton = $state<HTMLButtonElement>();

  // Mobile nav state
  let mobileNavOpen = $state(false);

  // selected nav state
  let selectedMenuItemId = $state<string>('--none');
  afterNavigate(() => {
    selectedMenuItemId = '--none';
  });

  async function openMobileNav() {
    mobileNavOpen = true;
    if (typeof document !== 'undefined') {
      // Check if running in browser
      document.body.classList.add('usa-js-mobile-nav--active');
      await tick();
      closeButton?.focus();
    }
  }

  function closeMobileNav(restoreFocus = false) {
    mobileNavOpen = false;
    if (typeof document !== 'undefined') {
      // Check if running in browser
      document.body.classList.remove('usa-js-mobile-nav--active');
      if (restoreFocus) menuButton?.focus();
    }
  }

  function handleNavKeydown(event: KeyboardEvent) {
    if (!mobileNavOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMobileNav(true);
    } else if (event.key === 'Tab') {
      const controls = [...mobileNavigation.querySelectorAll<HTMLElement>('a[href], button, input')]
        .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }

  function toggleMenuItem(itemId: string | undefined) {
    if (itemId) {
      selectedMenuItemId = selectedMenuItemId == itemId ? '--none' : itemId;
    } else {
      selectedMenuItemId = '--none';
    }
  }

  function clickOutside(node: HTMLElement, callback: () => void) {
    const handleClick = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick, true);

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      }
    };
  }

  // Make header configuration available to child components
  setContext('usaHeader', {
    kind,
    projectInfo,
    menuItems,
    secondaryLinks,
    search
  });

  afterNavigate(() => {
    selectedMenuItemId = '--none';
    closeMobileNav();
  });
</script>

<svelte:window onkeydown={handleNavKeydown} />

<div class="usa-overlay" class:is-visible={mobileNavOpen}></div>
<header class="usa-header usa-header--{kind}">
  <div class="usa-nav-container">
    <div class="usa-navbar">
      {#if logoSnippet}
        {@render logoSnippet()}
      {:else}
        <!-- Project Title Area -->
        <div class="usa-logo" id="header-logo">
          <!-- {projectTitle} -->
          {#if projectInfo.customMarkup}
            {@html projectInfo.customMarkup}
          {:else}
            <a href={projectInfo.href} class="usa-logo__text">
              {#if projectInfo.logo && projectInfo.logo.src}
                <img src={projectInfo.logo.src} alt={projectInfo.logo.alt} class="usa-logo__img" />
              {/if}
              {#if projectInfo.text}
                <span>{projectInfo.text}</span>
              {/if}
            </a>
          {/if}
        </div>
      {/if}
      <!-- Menu Button -->
      <button bind:this={menuButton} class="usa-menu-btn" aria-controls="primary-navigation" aria-expanded={mobileNavOpen} onclick={openMobileNav}>Menu</button>
    </div>
    <nav
      bind:this={mobileNavigation}
      id="primary-navigation"
      aria-label="Primary navigation"
      class={['usa-nav', 'site-nav']}
      class:is-visible={mobileNavOpen}
      use:clickOutside={() => mobileNavOpen && closeMobileNav()}
    >
      {#if mobileNavOpen}
        <!-- Close Button -->
        <button bind:this={closeButton} class="usa-nav__close" onclick={() => closeMobileNav(true)}>
          <svg class="usa-icon usa-icon--size-3" aria-labelledby="site-nav-close" role="img">
            <title id="site-nav-close">Close</title>
            <use href={asset('/uswds/img/sprite.svg#close')}></use>
          </svg>
        </button>
      {/if}
      <!-- Main Navigation Area -->
      <ul class="usa-nav__primary usa-accordion">
        {#each identifiedMenuItems as item (item.id)}
          <li class="usa-nav__primary-item">
            <MenuItem {item} {selectedMenuItemId} {toggleMenuItem} />
          </li>
        {/each}
      </ul>
      {#if kind === 'basic' && search.enabled}
        <div class="usa-search__wrapper">
          <form
            class="usa-search fedramp-search usa-search--small"
            accept-charset="UTF-8"
            action={search.action}
            id="search_form"
            method="get"
            role="search"
          >
            <div style="margin: 0;padding: 0;display: inline;">
              <input name="utf8" type="hidden" value="&#x2713;" />
            </div>
            <label class="usa-sr-only" for="header-search">
              {search.placeholder}
            </label>
            <input id="affiliate" name="affiliate" type="hidden" value="fedramp" />
            <input
              id="header-search"
              class="usa-input usagov-search-autocomplete"
              type="search"
              name="query"
              autocomplete="off"
              placeholder={search.placeholder}
            />
            <!-- Search Button (basic) -->
            <button id="header-search-button" class="usa-button" type="submit" value="Search">
              <span class="usa-sr-only">Search</span>
              <svg class="usa-icon usa-search__submit-icon" aria-hidden="true" focusable="false" role="img" aria-labelledby="search-icon-title">
                <title id="search-icon-title">Search Submit Icon</title>
                <use href={asset('/uswds/img/usa-icons/search.svg')}></use>
              </svg>
            </button>
          </form>
        </div>
      {/if}

      <div class="usa-header__nav-container">
        {#if kind === 'extended'}
          <div class="usa-header-nav--secondary">
            <!-- Secondary Navigation Area -->
            {#if secondaryLinks.length > 0}
              <div class="usa-nav__secondary-links">
                <ul class="usa-nav__secondary-items">
                  {#each secondaryLinks as link (link.href)}
                    <li class="usa-nav__secondary-item">
                      <a href={link.href}>{link.text}</a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Search Area -->
            {#if search.enabled}
              <div class="usa-search__wrapper">
                <form
                  class="usa-search fedramp-search usa-search--small"
                  accept-charset="UTF-8"
                  action={search.action}
                  id="search_form"
                  method="get"
                  role="search"
                >
                  <div style="margin: 0;padding: 0;display: inline;">
                    <input name="utf8" type="hidden" value="&#x2713;" />
                  </div>
                  <label class="usa-sr-only" for="header-search">
                    {search.placeholder}
                  </label>
                  <input id="affiliate" name="affiliate" type="hidden" value="fedramp" />
                  <input
                    id="header-search"
                    class="usa-input usagov-search-autocomplete"
                    type="search"
                    name="query"
                    autocomplete="off"
                    placeholder={search.placeholder}
                  />
                  <!-- Search Button (extended) -->
                  <button id="header-search-button" class="usa-button" type="submit" value="Search">
                    <span class="usa-sr-only">{search.buttonText}</span>
                  </button>
                </form>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </nav>
  </div>
</header>
<noscript>
  <nav class="no-script-navigation" aria-label="Navigation without JavaScript">
    {#each menuItems as item (item.id)}
      {#if item.children}
        {#each item.children as child (child.id)}<a href={resolve(child.href ?? '/')}>{child.text}</a>{/each}
      {:else}<a href={resolve(item.href ?? '/')}>{item.text}</a>{/if}
    {/each}
  </nav>
</noscript>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  .no-script-navigation { display:flex; flex-wrap:wrap; gap:1rem; padding:1rem; }
  .no-script-navigation a { color: #fff; }

  // TODO: automatic alternating colors for top-level menu buttons doesn't
  // We'll define CSS variables on the parent <li> elements
  // and then have the MenuItem's interactive elements consume them.

  // Define colors for odd-numbered menu items
  .usa-nav__primary-item:nth-child(odd) {
    --menu-item-bg: #{uswds.color('secondary')};
    --menu-item-text: #{uswds.color('white')};
    --menu-item-hover-bg: #{uswds.color('secondary-darker')};
    --menu-item-hover-text: #{uswds.color('white')};
  }

  // Define colors for even-numbered menu items
  .usa-nav__primary-item:nth-child(even) {
    --menu-item-bg: #{uswds.color('secondary-light')};
    --menu-item-text: #{uswds.color('ink')};
    --menu-item-hover-bg: #{uswds.color('base-lighter')};
    --menu-item-hover-text: #{uswds.color('ink')};
  }

  // Apply these alternating colors to the actual interactive elements within MenuItem
  .usa-nav__primary-item .usa-button,
  .usa-nav__primary-item .usa-nav__link {
    background-color: var(--menu-item-bg, initial) !important;
    color: var(--menu-item-text, initial) !important;
    // Ensure padding for visibility when background changes
    padding: 0.75rem 1rem !important; // Adjust as needed to make the background visible

    &:hover,
    &:focus {
      background-color: var(--menu-item-hover-bg, var(--menu-item-bg, initial));
      color: var(--menu-item-hover-text, var(--menu-item-text, initial));
      // Always ensure a strong focus outline for accessibility
      outline: 0.25rem solid;
      outline-offset: 0.125rem;
    }
    // Ensure SVG icons within the button inherit the text color if present
    svg {
      fill: currentColor;
    }
  }

  // --- Resetting other specific buttons to USWDS defaults (or minimal styling) ---
  // The Menu, Close, and Search buttons are distinct and not part of the alternating sequence.
  // We'll let them mostly use their USWDS default styling or ensure they have good contrast.

  // .usa-menu-btn,
  // .usa-nav__close,
  // #header-search-button.usa-button {
  //   // Revert to USWDS defaults or ensure good contrast for these individual buttons
  //   // For example, if USWDS default is not high enough contrast:
  //   background-color: uswds.color('primary-light');
  //   color: uswds.color('white');
  //   &:hover, &:focus {
  //     background-color: uswds.color('base-dark');
  //     color: uswds.color('white');
  //     outline: 0.25rem solid;
  //     outline-offset: 0.125rem;
  //   }
  //   svg {
  //     fill: currentColor;
  //   }
  // }
  // .usa-nav__close {
  //   background-color: uswds.color('secondary-dark'); // Using a different color for close
  //   &:hover, &:focus {
  //     background-color: uswds.color('secondary-darker');
  //   }
  // }

  .usa-header {
    width: 100%;
    &--extended {
      .usa-header-nav--secondary {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 0.5rem 0;
      }
    }
    .usa-logo__img {
      width: auto;
      height: 100px;
    }
    .usa-nav {
      &__extra-links {
        margin-left: 1rem;
      }
      &__extra-items {
        display: flex;
        list-style-type: none;
        margin: 0;
        padding: 0;
      }
      .usa-nav__extra-item {
        margin-left: 1rem;
      }
    }
  }
  @media (min-width: uswds.units('desktop')) {
    .usa-header--basic .usa-navbar {
      position: relative;
      width: 23% !important;
    }
    .usa-nav__primary { flex-wrap: wrap; min-width: 0; }
    .usa-nav__primary-item {
      position: relative !important;
      .usa-nav__link {
        // Remove direct padding here if the alternating colors need to control it
        // padding: 0 0.5rem 0 0 !important;
        &:hover::after {
          background-color: #f5b755;
        }
      }
      align-content: center;
    }
    .usa-nav__primary li:nth-child(-n + 3) {
      margin-right: 0.5rem;
    }
    .usa-accordion {
      gap: 0.5rem;
    }
  }
  @media (max-width: uswds.units('desktop')) {
    .usa-accordion {
      gap: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .usa-nav__primary-item {
      border: none;
    }
  }
  .site-nav {
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap;
    @media (min-width: uswds.units('desktop')) {
      z-index: 200;
      position: sticky;
      top: 0;
    }
  }
  @media (min-width: uswds.units('desktop')) {
    .usa-search__wrapper {
      width: 12.5rem;
      margin-left: 0.875rem;
    }
  }

  // Extra space on the left for smaller desktops
  @media (min-width: uswds.units('desktop')) and (max-width: uswds.units('desktop-lg')) {
    .usa-header--basic {
      .usa-nav {
        padding: 0 0 0.5rem 0;
      }
    }
  }

  // round the corners of the search bar //
  #header-search {
    border-radius: 4px 0 0 4px;
    min-height: 2.3rem;
    height: auto;
    width: 81%;
  }
  #header-search-button {
    border-radius: 0 4px 4px 0;
    min-height: 2.3rem;
    height: auto;
    outline-offset: 0;
  }
</style>
