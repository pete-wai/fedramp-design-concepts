<!-- routes/+layout.svelte -->
<script lang="ts">
  import '../styles/global.scss';
  import '$lib/styles/highlight.css';
  import type { Component } from 'svelte';
  import BackToTop from '$lib/components/BackToTop.svelte';
  import USABanner from '$lib/components/USABanner.svelte';
  import USAHeader from '$lib/components/USAHeader.svelte';
  import FedRAMPFooter from '$lib/components/FedRAMPFooter.svelte';
  import FedRAMPTTSFooter from '$lib/components/FedRAMPTTSFooter.svelte';
  import ArchiveBanner from '$lib/components/ArchiveBanner.svelte';
  import BasicHeroBanner from '$lib/components/BasicHeroBanner.svelte';
  import HeaderRev from '$lib/components/HeaderRev.svelte';
  import ShutdownBanner from '$lib/components/ShutdownBanner.svelte';
  import BetaBanner from '$lib/components/BetaBanner.svelte';
  import { asset, resolve } from '$lib/utils/paths';
  import { page } from '$app/state';
  import MarketplaceHeroBanner from '$lib/content/home-hero.svelte.md';
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { marketplaceDataStore } from '$lib/stores/MarketplaceStore';
  import { isStaticSiteRoute } from '$lib/utils/staticSiteRoutes';

  const IS_SHUTDOWN = import.meta.env.VITE_IS_SHUTDOWN === 'true';

  let { data, children } = $props();
  const { projectInfo, menuItems, search, heroBannerValues } = $derived(data);

  if (browser) {
    beforeNavigate(({ to, cancel }) => {
      if (!to?.url || !isStaticSiteRoute(to.url.pathname)) return;

      cancel();
      window.location.assign(to.url.href);
    });
  }

  // Marketplace data
  let marketplaceData = $derived(page.data?.fedRAMPData ?? []);

  // Seed the client-side MarketplaceStore from the server-loaded page data.
  // fedRAMPData is provided by the homepage load() (for the Glance metrics) and the
  // marketplace listing pages. Detail pages no longer rely on this store.
  $effect(() => {
    if (browser && page.url.pathname.includes('/marketplace/') && marketplaceData?.data?.Products?.length > 0) {
      marketplaceDataStore.set(marketplaceData);
    }
  });

  // URL booleans for banners
  let pageUrl = $derived(page.url.pathname);
  let isArchived = $derived(pageUrl.startsWith(resolve('/archive')));
  let isBlogsRoute = $derived(page.data?.inBlogsGroup || pageUrl.startsWith(resolve('/(pages)/blog')));
  let isUpdatesRoute = $derived(page.data?.inUpdatesGroup);
  let is20xRoute = $derived(pageUrl.startsWith(resolve('/(pages)/20x')));
  let isAgencyAuthRoute = $derived(pageUrl.startsWith(resolve('/rev5/agency-authorization/')));
  let isDocsRoute = $derived(pageUrl.startsWith(resolve('/rev5/documents-templates/')));
  let isStakeholdersRoute = $derived(pageUrl.startsWith(resolve('/rev5/stakeholders/')));
  let isHomePage = $derived(page.route.id === '/(pages)');
  let isMarketplacePages = $derived(() => {
    return pageUrl.includes(resolve('/marketplace/'));
  });
  let isMarketplaceRoute = $derived(pageUrl.startsWith(resolve('/marketplace/')));
  let isSchemasRoute = $derived(pageUrl === resolve('/schemas/'));
  let isSchemasValidatorRoute = $derived(pageUrl.startsWith(resolve('/schemas/validator')));
  let isBrandGuideRoute = $derived(pageUrl.startsWith(resolve('/(pages)/brand')));

  function getUpdatesHeroBannerValues(pathname: string): {
    heroBannerHeading: string;
    heroBannerText?: string;
    heroBannerClass: string;
  } {
    const subRoute = pathname.replace(resolve('/'), '').split('/')[0];
    if (heroBannerValues?.updates && subRoute in heroBannerValues.updates) {
      return heroBannerValues.updates[subRoute as keyof typeof heroBannerValues.updates];
    }
    return {
      heroBannerHeading: '',
      heroBannerText: '',
      heroBannerClass: ''
    };
  }

  function urlToTitle(url: string) {
    return url
      .split(/[/-]/)
      .filter((segment) => segment.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Metadata for SEO
  let siteUrl = $derived(browser ? page.url.origin : 'https://www.fedramp.gov');
  let completeUrl = $derived(page.url.href);
  let defaultTitle = 'FedRAMP | FedRAMP.gov';
  let defaultDescription =
    'The Federal Risk and Authorization Management Program, or FedRAMP, is a government-wide program that provides a standardized approach to security assessment.';
  let defaultMetaImage = asset('/thumbnail-image.png');
  let currentTitle = $derived(page.data?.metaTitle || urlToTitle(pageUrl) || defaultTitle);
  let tabTitle = $derived(page.data?.tabTitle || currentTitle);
  let currentDescription = $derived(page.data?.metaDescription || defaultDescription);
  let currentTags = $derived(page.data?.metaTags || undefined);
  let currentImage = $derived(page.data?.metaImage || defaultMetaImage);
  let updatesHeroBanner = $derived(getUpdatesHeroBannerValues(pageUrl));

  // Define a type for the header configuration for better type inference
  type HeaderConfig = {
    siteHeaderClass: string;
    hasGradientWrapper: boolean;
    gradientWrapperExtraClass: string;
    hasGradientBackground: boolean;
    hasMountainWrapper: boolean;
    mountainWrapperExtraClass: string;
    // heroComponent can be a Svelte component constructor, which typically has a 'new' signature
    // or null if no component
    heroComponent: Component | null;
    heroProps: Record<string, any>;
    renderChildrenInsideHeroArea: boolean;
  };

  let headerConfig: () => HeaderConfig = $derived(() => {
    let config = {
      siteHeaderClass: 'site-header',
      hasGradientWrapper: false,
      gradientWrapperExtraClass: '',
      hasGradientBackground: false,
      hasMountainWrapper: false,
      mountainWrapperExtraClass: '',
      heroComponent: null as any, // Can be a Svelte component
      heroProps: {},
      renderChildrenInsideHeroArea: false // For homepage specific rendering
    };

    switch (true) {
      case isHomePage:
        // HomePage is special: children are rendered inside the gradient-wrapper, no specific hero component
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.renderChildrenInsideHeroArea = true;
        config.heroComponent = MarketplaceHeroBanner;
        config.heroProps = { class: 'padding-bottom-1', data: marketplaceData };
        // config.hasMountainWrapper = true;
        // config.mountainWrapperExtraClass = 'home-page-mountain-wrapper';
        break;

      case isBlogsRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.blog.heroBannerHeading,
          bodyText: heroBannerValues.blog.heroBannerText,
          class: heroBannerValues.blog.heroBannerClass
        };
        break;

      case isUpdatesRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: updatesHeroBanner.heroBannerHeading,
          ...(updatesHeroBanner.heroBannerText && { bodyText: updatesHeroBanner.heroBannerText }),
          class: updatesHeroBanner.heroBannerClass
        };
        break;

      case is20xRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.gradientWrapperExtraClass = 'wrapper-blur';
        config.hasGradientBackground = false;
        config.hasMountainWrapper = false;
        config.heroComponent = null;
        break;

      case isAgencyAuthRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = HeaderRev;
        break;

      case isDocsRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.rev5.documents.heroBannerHeading,
          class: heroBannerValues.rev5.documents.heroBannerClass
        };
        break;

      case isStakeholdersRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.rev5.stakeholders.heroBannerHeading,
          class: heroBannerValues.rev5.stakeholders.heroBannerClass
        };
        break;

      case isMarketplacePages():
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        // config.heroComponent = MarketplaceHeroBanner;
        // config.heroProps = { class: 'padding-bottom-1' };
        break;

      case isSchemasRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.schemas.list.heroBannerHeading,
          class: heroBannerValues.schemas.list.heroBannerClass
        };
        break;

      case isSchemasValidatorRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.schemas.validator.heroBannerHeading,
          class: heroBannerValues.schemas.validator.heroBannerClass
        };
        break;

      case isBrandGuideRoute:
        config.siteHeaderClass = 'site-header transparent';
        config.hasGradientWrapper = true;
        config.hasGradientBackground = true;
        config.hasMountainWrapper = true;
        config.heroComponent = BasicHeroBanner;
        config.heroProps = {
          headingText: heroBannerValues.brand.heroBannerHeading,
          class: heroBannerValues.brand.heroBannerClass
        };
        break;

      // No default case is explicitly needed, as the initial 'config' object provides the default
      // for pages that don't match any specific route (i.e., non-gradient pages will retain the
      // initial 'site-header' class and `false` for all wrapper/background properties).
    }

    return config;
  });
</script>

<svelte:head>
  <title>{tabTitle}</title>
  <meta name="description" content={currentDescription} />
  {#if currentTags !== undefined}
    <meta name="keywords" content={currentTags} />
  {/if}

  <!-- Open Graph protocol -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={currentTitle} />
  <meta property="og:description" content={currentDescription} />
  <meta property="og:url" content={completeUrl} />

  <!-- Twitter -->
  <meta name="twitter:title" content={currentTitle} />
  <meta name="twitter:description" content={currentDescription} />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- Images -->
  <meta property="og:image" content="{siteUrl}{currentImage}" />
  <meta name="twitter:image" content="{siteUrl}{currentImage}" />
  <meta property="og:logo" content="{siteUrl}/fedramp-logo-inverse.svg" />
</svelte:head>

{#if page.error}
  {@render children()}
{:else if isHomePage || page.route.id?.startsWith('/community') || page.route.id?.startsWith('/engineering') || page.route.id?.startsWith('/agency-use')}
  {@render children()}
{:else}
  <!-- Skip Nav links for accessibility -->
  <nav aria-label="Skip links">
    <ul class="usa-skipnav-list">
      <!-- id main-content defined in /routes/(pages) and its subpages -->
      <li><a class="usa-skipnav" href="#main-content">Skip to main content</a></li>
    </ul>
  </nav>

  <!-- Official USA website banner -->
  <USABanner id="official-government-banner" language="auto" />

  <!-- Logo snippet for top-nav -->
  {#snippet logoSnippet()}
    <div class="usa-logo" id="logo">
      <a href={resolve('/')} title="Home" aria-label="FedRAMP home page">
        <img class="desktop usa-logo__img desktop:display-inline-block" src={asset('/fedramp-logo-inverse.svg')} alt="FedRAMP.gov logo" />
        <img class="mobile usa-logo__img desktop:display-none" src={asset('/fedramp-logo-inverse.svg')} alt="FedRAMP.gov logo" />
      </a>
    </div>
  {/snippet}

  <!-- Status/informational banners -->
  {#if isArchived}
    <ArchiveBanner />
  {/if}
  {#if IS_SHUTDOWN}
    <ShutdownBanner />
  {/if}
  {#if isMarketplaceRoute}
    <BetaBanner />
  {/if}

  <!-- Centralized Header and Hero Banner Area -->
  <!-- Adjusting header styling based on route -->
  {#if headerConfig().hasGradientWrapper}
    <div class="gradient-wrapper {headerConfig().gradientWrapperExtraClass}">
      {#if headerConfig().hasGradientBackground}
        <div class="gradient-background"></div>
      {/if}
      {#if headerConfig().hasMountainWrapper}
        <div class="mountain-wrapper {headerConfig().mountainWrapperExtraClass}">
          <!-- Decorative image, no need to alt-text -->
          <img src={asset('/mountain_abstract.svg')} class="mountain-img" alt="" aria-hidden="true" />
        </div>
      {/if}

      <!-- Top/global navigation bar -->
      <div class={headerConfig().siteHeaderClass}>
        <div id="top-nav" class="top-nav">
          <USAHeader kind="basic" {projectInfo} {menuItems} {search} {logoSnippet} />
        </div>
      </div>

      {#if headerConfig().heroComponent}
        {@const HeroComponent = headerConfig().heroComponent}
        <HeroComponent {...headerConfig().heroProps} />
      {/if}
      {#if headerConfig().renderChildrenInsideHeroArea}
        {@render children()}
      {/if}
    </div>
  {:else}
    <!-- Plain header for routes without a gradient hero -->
    <div class={headerConfig().siteHeaderClass}>
      <div id="top-nav" class="top-nav">
        <USAHeader kind="basic" {projectInfo} {menuItems} {search} {logoSnippet} />
      </div>
    </div>
  {/if}

  <!-- Page content for non-homepage routes, or routes not rendering children inside the hero area -->
  {#if !isHomePage && !headerConfig().renderChildrenInsideHeroArea}
    {@render children()}
  {/if}

  <!-- Footers and temporary elements -->
  <footer>
    <FedRAMPFooter />
    <FedRAMPTTSFooter />
  </footer>
  <BackToTop />
{/if}

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  // Logo is displayed differently on desktop vs. mobile viewport
  .usa-logo .usa-logo__img {
    @media (min-width: units('desktop')) {
      &.desktop {
        display: block;
        width: auto;
        height: 7.125rem;
        max-width: none;
      }
      &.mobile {
        display: none;
      }
    }
    @media (max-width: 63.99em) {
      &.desktop {
        display: none;
      }
      &.mobile {
        display: block;
        width: auto;
        height: 3rem;
      }
    }
  }

  // Wrapper styling for other headers
  .gradient-wrapper {
    position: relative;
  }
  .wrapper-blur {
    background: linear-gradient(180deg, uswds.color('primary-dark') 0%, #32172f 32.69%, rgba(27, 17, 32, 0) 86.54%);
  }
  .gradient-background {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, uswds.color('primary-dark'), #180e1d);
    z-index: -2;
  }
  .mountain-wrapper {
    position: absolute;
    top: 2%;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    overflow: hidden;
  }
  .home-page-mountain-wrapper {
    top: auto;
    bottom: clamp(50px, 19.5%, 250px);
    align-items: center;
    min-height: 100vh;
    min-width: 100vh;
  }
  .mountain-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .object-fit\:cover {
    object-fit: cover;
  }

  // Note that USWDS doesn't define a class for a list of skip nav links
  .usa-skipnav-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
