<!-- lib/components/HeaderRev.svelte -->
<script lang="ts">
  import type { ClassValue, HTMLAttributes } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    text?: string;
    other?: HTMLAttributes<HTMLDivElement>;
  };

  let {
    class: className,
    text = 'In the FedRAMP Rev 5 Agency Authorization path, agencies work directly with a cloud service provider (CSP) for authorization. CSPs that make a business decision to work directly with an agency to pursue an Authority to Operate (ATO) will work with the agency throughout the FedRAMP authorization process.',
    ...other
  }: Props = $props();
</script>

<div class="usa-section {className}" {...other}>
  <div class="grid-container-desktop-lg">
    <div class="grid-row grid-gap usa-prose">
      <div class="desktop:grid-col-4">
        <h1 class="usa-heading">FedRAMP® Rev 5 Agency Authorization</h1>
      </div>
      <div class="desktop:grid-col-8">
        <h2 class="usa-heading-sub">Pursuing a FedRAMP Rev 5 Agency Authorization</h2>
        <p class="usa-text">{text}</p>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .usa-section {
    color: white;
    padding: 3rem;

    @media (min-width: 40em) {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }
  }

  .usa-heading {
    margin: 0;
    font-size: 2.25rem;
    text-align: center;
    line-height: 1.2;
  }

  .usa-heading-sub {
    margin: 0 0 1rem 0;
    font-size: 2rem;
    text-align: left;
    line-height: 1.2;
  }

  .usa-text {
    margin: 0;
    text-align: left;
    line-height: 1.5;
  }

  .usa-prose {
    > * + * {
      margin-top: 0;
    }
  }

  @media (max-width: 640px) {
    .grid-row > :first-child {
      margin-bottom: 2rem;
    }
  }
</style>
