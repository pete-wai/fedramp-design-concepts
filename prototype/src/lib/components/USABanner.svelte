<!-- lib/components/USABanner.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { generateId } from '$lib/utils/id';
  import flagImg from '@uswds/uswds/dist/img/us_flag_small.png';
  import dotGovIcon from '@uswds/uswds/dist/img/icon-dot-gov.svg';
  import httpsIcon from '@uswds/uswds/dist/img/icon-https.svg';

  // Props
  export let id = generateId('usa-banner');
  export let language: 'english' | 'spanish' | 'auto' = 'english';
  export let showLanguageToggle = false;
  export let alwaysExpandOnMobile = false;

  // Assets
  export let flagImgPath = flagImg;
  export let dotGovIconPath = dotGovIcon;
  export let httpsIconPath = httpsIcon;

  // State
  let isExpanded = false;
  let currentLanguage: 'english' | 'spanish' =
    language === 'auto' ? (browser && navigator.language.startsWith('es') ? 'spanish' : 'english') : language;

  // Content based on language
  // TODO: This can be internationalized
  const texts = {
    english: {
      header: 'An official website of the United States government',
      action: "Here's how you know",
      dotGovTitle: 'Official websites use .gov',
      dotGovText: 'A .gov website belongs to an official government organization in the United States.',
      httpsTitle: 'Secure .gov websites use HTTPS',
      httpsText:
        "A lock or https:// means you've safely connected to the .gov website. Share sensitive information only on official, secure websites."
    },
    spanish: {
      header: 'Un sitio oficial del Gobierno de Estados Unidos',
      action: 'Así es como usted puede verificarlo',
      dotGovTitle: 'Los sitios web oficiales usan .gov',
      dotGovText: 'Un sitio web .gov pertenece a una organización oficial del Gobierno de Estados Unidos.',
      httpsTitle: 'Los sitios web seguros .gov usan HTTPS',
      httpsText:
        'Un candado o https:// significa que usted se conectó de forma segura a un sitio web .gov. Comparta información sensible sólo en sitios web oficiales y seguros.'
    }
  };

  // Get text based on current language
  $: text = texts[currentLanguage];

  // Content ID for ARIA
  const contentId = `${id}-content`;

  // Handle button click to toggle expanded state
  function toggleBanner(event: MouseEvent) {
    // The shell owns this disclosure; do not also invoke delegated USWDS toggles.
    event.stopPropagation();
    if (!browser) return;
    isExpanded = !isExpanded;
  }

  // Handle language toggle
  function toggleLanguage() {
    if (!browser) return;
    currentLanguage = currentLanguage === 'english' ? 'spanish' : 'english';

    // Save preference in localStorage if available
    try {
      localStorage.setItem('usa-banner-language', currentLanguage);
    } catch {
      // Ignore localStorage errors
    }
  }

  // Initialize
  onMount(() => {
    if (!browser) return;

    // Check for saved language preference
    try {
      const savedLanguage = localStorage.getItem('usa-banner-language');
      if (savedLanguage === 'english' || savedLanguage === 'spanish') {
        currentLanguage = savedLanguage;
      }
    } catch {
      // Ignore localStorage errors
    }

    // Check if we should auto-expand on mobile
    if (alwaysExpandOnMobile && window.innerWidth < 640) {
      isExpanded = true;
    }
  });
</script>

<section
  class="usa-banner"
  data-testid="usa-banner"
  class:usa-banner--expanded={isExpanded}
  lang={currentLanguage === 'spanish' ? 'es' : 'en'}
  aria-label={currentLanguage === 'spanish' ? 'Sitio oficial del gobierno' : 'Official government website'}
>
  <div class="usa-accordion">
    <header class="usa-banner__header">
      <div class="usa-banner__inner">
        <div class="grid-col-auto">
          <img class="usa-banner__header-flag" src={flagImgPath} alt={currentLanguage === 'spanish' ? 'Bandera de U.S.A.' : 'U.S. flag'} />
        </div>

        <div class="grid-col-fill tablet:grid-col-auto">
          <p class="usa-banner__header-text">
            {text.header}
          </p>
          <p class="usa-banner__header-action" aria-hidden="true">
            {text.action}
          </p>
        </div>

        <button
          class="usa-accordion__button usa-banner__button"
          aria-expanded={isExpanded ? 'true' : 'false'}
          aria-controls={contentId}
          on:click={toggleBanner}
          type="button"
        >
          <span class="usa-banner__button-text">{text.action}</span>
        </button>

        {#if showLanguageToggle}
          <div class="usa-banner__language-toggle">
            <button
              class="usa-button usa-button--outline usa-button--inverse-on-dark usa-button--small"
              on:click={toggleLanguage}
              type="button"
              aria-label={currentLanguage === 'spanish' ? 'Cambiar a inglés' : 'Switch to Spanish'}
            >
              {currentLanguage === 'english' ? 'Español' : 'English'}
            </button>
          </div>
        {/if}
      </div>
    </header>

      <div class="usa-banner__content usa-accordion__content" id={contentId} hidden={!isExpanded}>
        <div class="grid-row grid-gap-lg">
          <div class="usa-banner__guidance tablet:grid-col-6">
            <img class="usa-banner__icon usa-media-block__img" src={dotGovIconPath} alt="Government Building Icon" aria-hidden="true" />
            <div class="usa-media-block__body">
              <p>
                <strong>{text.dotGovTitle}</strong><br />
                {text.dotGovText}
              </p>
              <slot name="gov-guidance" />
            </div>
          </div>

          <div class="usa-banner__guidance tablet:grid-col-6">
            <img class="usa-banner__icon usa-media-block__img" src={httpsIconPath} alt="Lock Icon" aria-hidden="true" />
            <div class="usa-media-block__body">
              <p>
                <strong>{text.httpsTitle}</strong><br />
                {text.httpsText}
              </p>
              <slot name="https-guidance" />
            </div>
          </div>
        </div>

        <slot name="additional-content" />
      </div>
  </div>
</section>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  .usa-banner {
    &__language-toggle {
      @include uswds.u-margin-left(1);
      @include uswds.u-display('flex');
      @include uswds.u-flex('align-center');

      button {
        @include uswds.u-font('sans', '3xs');
        @include uswds.u-padding-x(1);
        @include uswds.u-padding-y('05');
        @include uswds.u-text('no-underline');
      }
    }

    @media (max-width: uswds.units('tablet')) {
      &__language-toggle {
        margin-top: 0.5rem;
      }
    }
  }
  .usa-banner__inner {
    max-width: 75rem;
  }
</style>
