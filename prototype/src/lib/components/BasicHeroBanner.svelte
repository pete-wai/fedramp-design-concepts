<!-- lib/components/BasicHeroBanner.svelte -->
<script lang="ts">
  import type { ClassValue, HTMLAttributes } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    headingText: string;
    bodyText?: string;
    other?: HTMLAttributes<HTMLDivElement>;
  };

  let { class: className, headingText, bodyText, ...other }: Props = $props();
</script>

<section class={['usa-section', className]} aria-label={headingText} {...other}>
  <div class="grid-container-desktop-lg usa-prose">
    <h1><sans>{headingText}</sans></h1>
    <p>{bodyText}</p>
  </div>
</section>

<style>
  @media (min-width: 40em) {
    .usa-section {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }
  }
</style>
