<!-- lib/components/UniversalSearchSkeleton.svelte -->
<script lang="ts">
  interface Props {
    cardCount?: number;
    filterGroupCount?: number;
  }

  let { cardCount = 6, filterGroupCount = 5 }: Props = $props();
</script>

<div class="universal-search">
  <section class="search-header mobile-only">
    <div class="mobile-action-buttons">
      <div class="skeleton-button"></div>
    </div>
    <div class="skeleton-search-bar"></div>
  </section>

  <main id="main-content">
    <div class="grid-row grid-gap">
      <div class="grid-col-12 desktop:grid-col-3">
        <div class="sidebar">
          <div class="desktop-search desktop-only">
            <div class="skeleton-search-bar"></div>
          </div>

          <div class="filters-panel desktop-only">
            <div class="filters-section">
              <div class="filters-header">
                <div class="skeleton-line width-card height-3"></div>
              </div>

              <div class="sort-controls-section">
                <div class="skeleton-line skeleton-line--short margin-bottom-1"></div>
                <div class="skeleton-select"></div>
              </div>

              {#each Array.from({ length: filterGroupCount }, (_, i) => i) as i (i)}
                <div class="skeleton-filter-group">
                  <div class="skeleton-line width-mobile margin-bottom-105"></div>
                  {#each Array.from({ length: 3 }, (_, j) => j) as j (j)}
                    <div class="skeleton-checkbox-row">
                      <div class="skeleton-checkbox-box"></div>
                      <div class="skeleton-line skeleton-line--dynamic-{j}"></div>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="grid-col-12 desktop:grid-col-9 results-column">
        <div class="results-container">
          <header class="results-header">
            <div class="skeleton-text-box skeleton-text-box--short"></div>
            <div class="results-controls">
              <div class="skeleton-toggle"></div>
              <div class="skeleton-button skeleton-button--short"></div>
            </div>
          </header>

          <!-- Result Cards -->
          <div class="results-content">
            {#each Array.from({ length: cardCount }, (_, i) => i) as i (i)}
              <div class="skeleton-product-card">
                <div class="skeleton-left">
                  <div class="skeleton-line skeleton-line--short"></div>
                  <div class="skeleton-line skeleton-line--long"></div>
                  <div class="skeleton-badges">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-badge"></div>
                  </div>
                  <div class="skeleton-counts">
                    <div class="skeleton-count"></div>
                    <div class="skeleton-count"></div>
                  </div>
                </div>
                <div class="skeleton-right">
                  <div class="skeleton-tag"></div>
                  <div class="skeleton-logo"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  // Animation
  @keyframes skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  // Shared base
  %skeleton-base {
    background: #e0e0e0;
    border-radius: 4px;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  // Layout
  .universal-search {
    width: 100%;
    min-height: 100vh;
  }

  #main-content {
    width: 100%;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  @media (min-width: 64em) {
    .desktop-only {
      display: block;
    }
    .mobile-only {
      display: none;
    }
  }

  // Mobile search header
  .search-header {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 1.5rem 0 1rem;
    background-color: white;
    border-bottom: 1px solid uswds.color('gray-10');

    @media (min-width: 40em) {
      .skeleton-button {
        width: 7.5rem;
      }
    }
  }

  .mobile-action-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  // Sidebar
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .desktop-search {
    position: sticky;
    top: 0;
    z-index: 102;
    background: white;
    padding-bottom: 1rem;
    margin-bottom: 0.75rem;
  }

  .filters-panel {
    z-index: 101;
    position: sticky;
    background-color: white;
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.5rem;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 2rem;

    @media (min-width: 64em) {
      top: calc(120px + 1rem);
    }
  }

  .filters-section {
    padding: 0.75rem 1rem;
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .sort-controls-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid uswds.color('gray-20');
  }

  // Results section
  .results-column {
    display: flex;
    flex-direction: column;
  }

  .results-container {
    flex: 1;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    place-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid uswds.color('gray-30');
    gap: 1rem;

    @media (max-width: 64em) {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .results-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .results-content {
    min-height: 400px;
  }

  // Skeleton elements
  .skeleton-search-bar {
    @extend %skeleton-base;
    height: 3rem;
    width: 100%;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
  }

  .skeleton-button {
    @extend %skeleton-base;
    height: 2.5rem;
    width: 120px;
    border-radius: 0.5rem;

    &--short {
      width: 120px;
    }

    &--long {
      width: 100%;
    }
  }

  .skeleton-toggle {
    @extend %skeleton-base;
    height: 2.5rem;
    width: 130px;
    border-radius: 0.25rem;
  }

  .skeleton-select {
    @extend %skeleton-base;
    height: 2.5rem;
    width: 100%;
    border-radius: 0.25rem;
  }

  .skeleton-line {
    @extend %skeleton-base;
    height: 14px;
    width: 100%;

    &--short {
      width: 40%;
    }

    &--long {
      width: 65%;
      height: 20px;
      margin-bottom: 0.75rem;
    }

    &--dynamic-0 {
      width: 60%;
    }
    &--dynamic-1 {
      width: 70%;
    }
    &--dynamic-2 {
      width: 80%;
    }
  }

  .skeleton-text-box {
    @extend %skeleton-base;
    height: 2.25rem;

    &--short {
      width: 50%;
    }

    &--long {
      width: 75%;
    }
  }

  .skeleton-filter-group {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid uswds.color('gray-10');

    &:last-child {
      border-bottom: none;
    }
  }

  .skeleton-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .skeleton-checkbox-box {
    @extend %skeleton-base;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    border-radius: 2px;
  }

  // Skeleton product card
  .skeleton-product-card {
    background: white;
    border: 1px solid #d6d0dd;
    border-radius: 0.5rem;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    display: flex;
    flex-direction: row;
    gap: 2rem;
    min-height: 100px;
    margin-bottom: 0.75rem;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  .skeleton-left {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    order: 1;
  }

  .skeleton-right {
    flex: 0 0 200px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    order: 2;
  }

  .skeleton-tag {
    @extend %skeleton-base;
    height: 28px;
    width: 60px;
    align-self: flex-end;
    border-radius: 0.4rem;
  }

  .skeleton-logo {
    @extend %skeleton-base;
    flex: 1 1 auto;
    min-height: 120px;
    max-height: 120px;
    border-radius: 0.5rem;
  }

  .skeleton-badges {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.25rem;
  }

  .skeleton-badge {
    @extend %skeleton-base;
    height: 28px;
    width: 120px;
    border-radius: 0.25rem;
  }

  .skeleton-counts {
    display: flex;
    gap: 1rem;
    padding-top: 0.6rem;
    border-top: 1px solid #e8e4ec;
  }

  .skeleton-count {
    @extend %skeleton-base;
    height: 20px;
    width: 80px;
    border-radius: 4px;
  }

  // Mobile styling
  @media (max-width: 768px) {
    .skeleton-product-card {
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
    }

    .skeleton-left {
      order: 2;
    }

    .skeleton-button {
      width: 100%;
    }

    .skeleton-right {
      flex: 0 0 100px;
      order: 1;
    }

    .skeleton-logo {
      max-height: 100px;
    }

    .skeleton-badges {
      flex-direction: column;
      padding: 0.375rem 0.75rem;
    }

    .results-controls {
      justify-content: space-between;
      width: 100%;

      .skeleton-button {
        width: 7.5rem;
        flex-shrink: 0;
      }
    }
  }
</style>
