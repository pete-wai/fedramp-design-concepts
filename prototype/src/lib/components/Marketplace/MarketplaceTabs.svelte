<!-- lib/components/Marketplace/MarketplaceTabs.svelte -->
<script lang="ts">
  import { resolve } from '$lib/utils/paths';
  import { page } from '$app/state';

  interface Tab {
    name: string;
    id: string;
    href?: string;
  }

  let {
    tabs = [],
    activeTab = $bindable()
  }: {
    tabs?: Tab[];
    activeTab?: string;
  } = $props();

  let tabButtons: HTMLButtonElement[] | HTMLAnchorElement[] = $state([]);
  let slider: HTMLDivElement | undefined = $state();
  let tabContainer: HTMLDivElement | undefined = $state();

  function updateSlider() {
    if (slider && tabButtons.length > 0 && tabs.length > 0) {
      const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (activeIndex >= 0 && tabButtons[activeIndex]) {
        const button = tabButtons[activeIndex];

        const buttonWidth = button.offsetWidth;
        const buttonLeft = button.offsetLeft;

        slider.style.width = `${buttonWidth}px`;
        slider.style.left = `${buttonLeft}px`;
      }
    }
  }

  function scrollToActiveTab() {
    if (tabContainer && tabButtons.length > 0 && tabs.length > 0) {
      const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (activeIndex >= 0 && tabButtons[activeIndex]) {
        const button = tabButtons[activeIndex];

        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        const containerWidth = tabContainer.clientWidth;

        const targetScrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

        tabContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }

  function handleTabClick(tabId: string) {
    activeTab = tabId;
    setTimeout(scrollToActiveTab, 10);
  }

  $effect(() => {
    if (tabs.length > 0) {
      const currentPath = page.url.pathname;
      const matchingTab = tabs.find((tab) => tab.href && currentPath.includes(tab.href));

      if (matchingTab) {
        activeTab = matchingTab.id;
      } else if (!activeTab) {
        activeTab = tabs[0].id;
      }
    }

    updateSlider();
    scrollToActiveTab();
  });
</script>

<nav class="tab-navigation" aria-label="Tab Navigation">
  {#if tabs.length > 0}
    <div bind:this={tabContainer} class="tab-container">
      {#each tabs as tab, index (tab.id)}
        {#if tab.href}
          <a
            bind:this={tabButtons[index]}
            class="tab-button"
            class:active={activeTab === tab.id}
            href={(resolve as (path: string) => string)(tab.href)}
            data-sveltekit-noscroll
            onclick={() => handleTabClick(tab.id)}
          >
            {tab.name}
          </a>
        {:else}
          <button bind:this={tabButtons[index]} class="tab-button" class:active={activeTab === tab.id} onclick={() => handleTabClick(tab.id)}>
            {tab.name}
          </button>
        {/if}
      {/each}
      <div bind:this={slider} class="slider"></div>
    </div>
  {:else}
    <div class="no-tabs-message">
      <p>No tabs found</p>
    </div>
  {/if}
</nav>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .tab-navigation {
    margin: 0 auto;
  }

  .tab-container {
    display: flex;
    gap: 2.813rem;
    border-bottom: 0.5px solid rgba(27, 17, 33, 0.75);
    padding: 0.813rem;
    position: relative;
  }

  .tab-button {
    background: none;
    border: none;
    font-size: 1.125rem;
    line-height: 1.875rem;
    font-weight: 400;
    color: rgba(27, 17, 33, 0.75);
    cursor: pointer;
    padding: 0;
    text-decoration: none;
    text-wrap: nowrap;

    &.active {
      font-weight: 600;
      color: uswds.color('primary-vivid');
    }

    &:hover:not(.active) {
      color: rgba(27, 27, 27, 0.9);
    }
  }

  .slider {
    position: absolute;
    bottom: -0.5px;
    height: 3px;
    background-color: uswds.color('primary-vivid');
    border-radius: 1.5px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .no-tabs-message {
    padding: 1rem 0;
    border-bottom: 0.5px solid rgba(27, 17, 33, 0.75);

    p {
      margin: 0;
      color: rgba(27, 17, 33, 0.75);
      font-size: 1rem;
      text-align: center;
    }
  }

  @media (max-width: 64em) {
    .tab-button {
      font-size: 1.375rem;
    }

    .tab-container {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      scroll-behavior: smooth; /* Additional smooth scrolling support */
    }
    .tab-container::-webkit-scrollbar {
      display: none;
    }
  }
</style>
