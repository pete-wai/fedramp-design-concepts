<!-- lib/components/Marketplace/MarketplaceTicker.svelte -->
<script lang="ts">
  import { resolve, asset } from '$lib/utils/paths';

  type TickerLogos = {
    id: string;
    logo: string;
    name: string;
  };

  /**
   * @typedef {object} Props
   * @property {TickerLogos[]} logos - An array of logo objects to be displayed in the ticker.
   * @property {number} [durationPerLogo=4] - A factor representing the animation duration allocated per logo. A higher number increases the total animation duration, making the ticker move slower. Defaults to 4.
   * @property {string} [logoSize='7rem'] - The size of each logo in the ticker. Accepts CSS size units (e.g., '50px', '7rem', '10vw'). Defaults to '7rem'.
   */
  type Props = {
    logos: TickerLogos[];
    copy: Record<string, string>;
    durationPerLogo?: number;
    logoSize?: string;
  };

  let { logos, copy, durationPerLogo = 4, logoSize = '7rem' }: Props = $props();

  let isPaused = $state(false);
  let tickerDuration = $derived(durationPerLogo * logos.length);

  let duplicatedLogos = $derived([...logos, ...logos]);
</script>

<section class="ticker-wrapper" aria-label={copy.tickerHeading}>
  <div class="text-center">
    <h2 class="ticker-title font-sans-lg">
      {copy.tickerHeading}
      <!-- <Tooltip position="right" colorMode="light" ariaLabel="Disclaimer about marketplace ticker" text={t('tooltip-marketplace-ticker-disclaimer')} /> -->
    </h2>
  </div>
  <button class="usa-button usa-button--outline" onclick={() => isPaused = !isPaused}>{isPaused ? copy.resumeTicker : copy.pauseTicker}</button>
  <div class="ticker-container">
    <div
      class="ticker-content"
      class:paused={isPaused}
      style="--animation-duration: {tickerDuration}s; --logo-size: {logoSize}; --logo-count: {logos.length};"
      role="marquee"
      aria-label={copy.tickerDescription}
    >
      {#each duplicatedLogos as logo, index (logo.id + index)}
        <div class="logo-item">
          <a href={resolve(`/marketplace/products/${logo.id}/`)} aria-label="Visit {logo.name}">
            <img src={asset(logo.logo)} alt={logo.name} loading="lazy" decoding="async" width="112" height="112" />
          </a>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .usa-button { margin-right: 0; max-width: 100%; }

  .ticker-wrapper {
    position: relative;
    width: 100%;
  }

  .ticker-container {
    overflow: hidden;
    height: 8rem;
    display: flex;
    align-items: center;
    background: #fff;
    box-shadow: 0 16px 30px rgba(71, 27, 60, 0.25);
  }

  .ticker-title {
    padding-top: 1rem;
    margin-bottom: 1rem;
  }

  .ticker-content {
    display: flex;
    gap: 5.75rem;
    white-space: nowrap;
    animation: scroll-seamless var(--animation-duration) linear infinite;
    will-change: transform;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000px;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .ticker-content.paused, .ticker-content:hover, .ticker-content:focus-within {
    animation-play-state: paused;
  }

  .logo-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--logo-size);
    width: var(--logo-size);
  }

  .logo-item img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    opacity: 0.7;
    transition: all 0.3s ease;
    backface-visibility: hidden;
  }

  .logo-item img:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  @media (prefers-reduced-motion: reduce) {
    .ticker-content { animation: none; flex-wrap: wrap; white-space: normal; gap: 1rem; justify-content: center; }
    .ticker-container { height: auto; }
    .logo-item:nth-child(n + 7) { display: none; }
  }

  @keyframes scroll-seamless {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(calc(-1 * (var(--logo-size) + 5.75rem) * var(--logo-count)), 0, 0);
    }
  }
</style>
