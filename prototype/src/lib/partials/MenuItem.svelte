<!-- lib/partials/MenuItem.svelte -->
<script lang="ts">
  import { asset, resolve } from '$lib/utils/paths';
  import { page } from '$app/state';
  import { browser } from '$app/environment';

  let { item, selectedMenuItemId, toggleMenuItem } = $props();

  let closeTimeout: ReturnType<typeof setTimeout> | null = null;
  let buttonRef = $state<HTMLButtonElement>();
  let submenuRef = $state<HTMLUListElement>();
  let isDesktopView = $state(false);

  const currentPathName = $derived(page.url.pathname);
  const isSelected = $derived(selectedMenuItemId && selectedMenuItemId !== '--none' && item.children && item.id === selectedMenuItemId);
  const parentIsActive = $derived(item.children && item.children.length > 0 ? hasActiveChild() : false);

  function isDesktop(): boolean {
    return isDesktopView;
  }

  function hasActiveChild(): boolean {
    if (!item.children || item.children.length === 0) return false;

    const checkChildren = (children: any[]): boolean => {
      return children.some((child) => {
        const childPath = child.href.startsWith('http') ? child.href : (resolve as (path: string) => string)(child.href);
        if (currentPathName === childPath) return true;

        if (child.grandChildren && child.grandChildren?.length > 0) {
          return checkChildren(child.grandChildren);
        }
        return false;
      });
    };

    return checkChildren(item.children);
  }

  function updateAriaExpanded(): void {
    if (!browser) return;

    const button = document.getElementById(`nav-button-${item.id}`);
    if (button) {
      button.setAttribute('aria-expanded', isSelected.toString());
    }
  }

  function handleButtonKeydown(event: KeyboardEvent): void {
    const actions: Record<string, () => void> = {
      Enter: () => {
        event.preventDefault();
        toggleMenuItem(item.id);
        setTimeout(() => updateAriaExpanded(), 0);
      },
      ' ': () => {
        // Space bar
        event.preventDefault();
        toggleMenuItem(item.id);
        setTimeout(() => updateAriaExpanded(), 0);
      },
      Escape: () => {
        if (isSelected) {
          event.preventDefault();
          toggleMenuItem(item.id);
          setTimeout(() => updateAriaExpanded(), 0);
        }
      }
    };

    const action = actions[event.key];
    if (action) action();
  }

  function handleSubmenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      toggleMenuItem(item.id);
      setTimeout(() => updateAriaExpanded(), 0);
      buttonRef?.focus();
    }
  }

  function handleClick(): void {
    if (isDesktop()) return;

    toggleMenuItem(item.id);
    setTimeout(() => updateAriaExpanded(), 0);
  }

  function openDropdown(): void {
    if (!isDesktop()) return;

    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    if (!isSelected) {
      toggleMenuItem(item.id);
      setTimeout(() => updateAriaExpanded(), 0);
    }
  }

  function scheduleClose(): void {
    if (!isDesktop()) return;

    closeTimeout = setTimeout(() => {
      if (isSelected) {
        toggleMenuItem(item.id);
        setTimeout(() => updateAriaExpanded(), 0);
      }
      closeTimeout = null;
    }, 300);
  }

  function keepOpen(): void {
    if (!isDesktop()) return;

    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    if (!isSelected) {
      toggleMenuItem(item.id);
      setTimeout(() => updateAriaExpanded(), 0);
    }
  }

  function closeDropdown(): void {
    if (!isDesktop()) return;
    scheduleClose();
  }

  $effect(() => {
    if (browser) {
      const checkDesktop = () => {
        isDesktopView = window.matchMedia('(min-width: 64em)').matches;
      };

      checkDesktop();
      const mediaQuery = window.matchMedia('(min-width: 64em)');
      mediaQuery.addEventListener('change', checkDesktop);

      return () => mediaQuery.removeEventListener('change', checkDesktop);
    }
  });

  function getHref(href: string): string {
    return href.startsWith('http') ? href : (resolve as (path: string) => string)(href);
  }

  function isActiveLink(href: string): boolean {
    return currentPathName.startsWith(getHref(href));
  }

  function darkerOnActivePage(href: string): string {
    if (isActiveLink(href)) {
      return 'nav-button-darker';
    }
    return '';
  }
</script>

{#if item.children}
  <!-- Regular dropdown menu item -->
  <div class="dropdown-container">
    <div class="menu-item-wrapper" role="none" onmouseenter={openDropdown} onmouseleave={scheduleClose}>
      <button
        bind:this={buttonRef}
        class="usa-accordion__button usa-nav__link nav-button regular-dropdown"
        class:active={parentIsActive}
        onclick={handleClick}
        onkeydown={handleButtonKeydown}
        aria-expanded={isSelected}
        aria-controls="nav-{item.id}"
        aria-haspopup="true"
        id="nav-button-{item.id}"
      >
        <span>{item.text}</span>
        {#if isSelected}
          <svg class="usa-icon" aria-labelledby="collapse-title" role="img">
            <title id="collapse-title">Collapse menu</title>
            <use href={asset('/uswds/img/sprite.svg#expand_less')}></use>
          </svg>
        {:else}
          <svg class="usa-icon" aria-labelledby="expand-title" role="img">
            <title id="expand-title">Expand menu</title>
            <use href={asset('/uswds/img/sprite.svg#expand_more')}></use>
          </svg>
        {/if}
      </button>
    </div>

    <ul
      bind:this={submenuRef}
      id="nav-{item.id}"
      class="usa-nav__submenu"
      class:selected={isSelected}
      role="menu"
      aria-labelledby="nav-button-{item.id}"
      onmouseenter={keepOpen}
      onmouseleave={closeDropdown}
      onkeydown={handleSubmenuKeydown}
    >
      {#each item.children as child (child)}
        <li class="usa-nav__submenu-item" role="none">
          <a
            href={getHref(child.href)}
            onclick={() => toggleMenuItem(item.id)}
            class:active={isActiveLink(child.href)}
            aria-current={isActiveLink(child.href) ? 'page' : undefined}
            data-sveltekit-reload={child.reload ? true : undefined}
            role="menuitem"
            tabindex={isSelected ? 0 : -1}
          >
            {child.text}
          </a>

          {#if child.grandChildren && child.grandChildren.length > 0}
            <ul class="usa-nav__submenu usa-nav__submenu--nested" role="menu" aria-label="Submenu for {child.text}">
              {#each child.grandChildren as grandChild (grandChild)}
                <li class="usa-nav__submenu-item" role="none">
                  <a
                    href={getHref(grandChild.href)}
                    onclick={() => toggleMenuItem(item.id)}
                    class:active={isActiveLink(grandChild.href)}
                    aria-current={isActiveLink(grandChild.href) ? 'page' : undefined}
                    role="menuitem"
                    tabindex={isSelected ? 0 : -1}
                  >
                    {grandChild.text}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <!-- Simple menu item -->
  <div class="regular-menu-wrapper">
    <a
      class="usa-button usa-button--secondary {darkerOnActivePage(item.href)}"
      href={getHref(item.href)}
      data-sveltekit-reload={item.reload ? true : undefined}
    >
      <span>{item.text}</span>
    </a>
  </div>
{/if}

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  @use 'sass:color';

  .dropdown-container {
    position: relative;
  }

  .menu-item-wrapper {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(245, 183, 85, 0.1);
    }
  }

  .regular-menu-wrapper {
    .usa-button {
      width: 100%;
      justify-content: center;
    }
  }

  .usa-button {
    span {
      white-space: normal;
    }
    min-height: 2.3rem;
    height: auto;
  }

  .nav-button-darker {
    background-color: color.adjust(#ce4929, $lightness: -10%);
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .usa-nav__submenu {
    display: none;
    visibility: hidden;
    position: absolute;
    z-index: 1000;
    border: solid black 1px;
    margin-top: 1rem;

    &.selected {
      display: block;
      visibility: visible;
    }

    @media (max-width: uswds.units('desktop')) {
      border: none;
      position: static;
    }
  }

  .usa-nav__submenu-item {
    a {
      display: block;
      padding: 0.75rem 1rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(245, 183, 85, 0.1);
      }
    }
  }

  .usa-nav__submenu--nested {
    display: block;
    visibility: visible;
    position: static;
    margin-left: 1rem;
    padding-left: 0.5rem;
    border: none;
    list-style-type: none;
    margin-top: 0 !important;

    .usa-nav__submenu-item a {
      font-size: 0.9em;
      padding: 0.75rem 0.5rem;
    }
  }

  .usa-nav__submenu-item .active {
    color: #ce4929;
    transform: scale(1.025);
    text-underline-offset: 6px;
    background-color: rgba(245, 183, 85, 0.1);
  }

  .fedramp-link {
    text-decoration: none;
    color: inherit;
    padding-top: 0;
    padding-bottom: 0;

    &:hover,
    &:focus {
      color: #f5b755 !important;
    }

    &:focus {
      outline: none !important;
    }
  }

  .fedramp-button {
    @media (max-width: uswds.units('desktop')) {
      pointer-events: auto;
      position: relative;
    }

    @media (min-width: uswds.units('desktop')) {
      pointer-events: none;
    }

    .fedramp-link {
      pointer-events: auto;
      position: relative;
      z-index: 1;
      display: inline-block;
    }

    .usa-icon {
      pointer-events: auto;
      cursor: pointer;
      position: relative;
      z-index: 1;
    }

    /* Mobile clickable area */
    @media (max-width: uswds.units('desktop')) {
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
      }
    }
  }

  button.usa-accordion__button.usa-nav__link.active {
    color: #f5b755;
    font-weight: 600;
  }

  button.usa-accordion__button.usa-nav__link.nav-button.fedramp-button {
    &[aria-expanded='true'] .fedramp-link {
      color: #f5b755;
    }

    @media (max-width: uswds.units('desktop')) {
      &.active .fedramp-link {
        color: #f5b755;
        font-weight: 600;
      }
    }

    @media (min-width: 64em) {
      &[aria-expanded='true'] .fedramp-link,
      &.active .fedramp-link {
        text-decoration: underline;
        text-underline-offset: 8px;
      }
    }
  }

  @media (min-width: 64em) {
    button.usa-accordion__button.usa-nav__link {
      padding: 0;
      height: fit-content;

      span {
        padding-right: 0;
      }
    }

    button.usa-accordion__button.usa-nav__link.nav-button {
      &.regular-dropdown[aria-expanded='true'] {
        color: #f5b755;
        background-color: transparent;
        text-decoration: none;
      }

      &.fedramp-button[aria-expanded='true'] {
        color: #f5b755;
        background-color: transparent;
        text-decoration: underline;
        text-underline-offset: 8px;
      }

      &[aria-expanded='false'] {
        background-color: transparent;
      }

      &.active {
        color: #f5b755;
        text-decoration: underline;
        text-underline-offset: 8px;
      }

      &.regular-dropdown.active:not([aria-expanded='true']) {
        text-decoration: underline;
        text-underline-offset: 8px;
      }
    }

    button[aria-expanded='true'] span::after,
    button[aria-expanded='false'] span::after {
      display: none !important;
    }

    .usa-nav__submenu {
      width: 14rem;
      background-color: #f5f5fa;
      border-radius: 8px;
    }

    .usa-nav__submenu-item {
      overflow: hidden;

      a {
        color: #2d1a39;
        transition:
          transform 0.3s ease,
          color 0.3s ease,
          background-color 0.2s ease;
        transform-origin: left center;

        &:hover {
          color: #ce4929;
          transform: scale(1.025);
          text-underline-offset: 6px;
        }
      }
    }
  }

  @media (max-width: uswds.units('desktop')) {
    .usa-nav__submenu-item {
      border: none;

      .active {
        color: #f5b755;
      }
    }

    .usa-icon {
      display: none;
    }

    .menu-item-wrapper .usa-nav__link .fedramp-link {
      padding: 0;
    }

    .usa-nav__submenu.selected,
    .usa-nav__submenu.fedramp-submenu.selected {
      display: block;
      visibility: visible;
    }
  }
</style>
