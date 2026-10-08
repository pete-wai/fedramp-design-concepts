<!-- lib/components/USATag.svelte -->
<script lang="ts">
  export let big: boolean = false;
  export let marketplaceStyling: boolean = false;
  export let href: string = '';
</script>

{#if href}
  <a
    {href}
    class="border-base-dark border-1px radius-lg padding-x-2 padding-y-1 margin-right-1 margin-bottom-1"
    class:usa-tag={true}
    class:marketplace-styling={marketplaceStyling}
    class:usa-tag--big={big}
  >
    <slot />
  </a>
{:else}
  <div
    class="border-base-dark border-1px radius-lg padding-x-2 padding-y-1 margin-right-1 margin-bottom-1"
    class:usa-tag={true}
    class:marketplace-styling={marketplaceStyling}
    class:usa-tag--big={big}
  >
    <slot />
  </div>
{/if}

<style>
  .marketplace-styling {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 6px 15px;
    gap: 10px;
    min-width: fit-content;
    min-height: fit-content;
    background: rgba(54, 95, 238, 0.1);
    border: 1px solid #878feb;
    border-radius: 15px;
    flex: none;
    order: 0;
    flex-grow: 0;
    max-width: 200px;

    /* Text Styling */
    font-style: normal;
    font-weight: 400;
    line-height: 1.2;
    display: flex;
    align-items: center;
    letter-spacing: 0.01em;
    color: #365fee !important;
    white-space: normal;
    word-wrap: break-word;
    text-decoration: none;

    transition: all 0.2s ease-in-out;
  }

  a.usa-tag {
    text-decoration: none;
    transition: color 0.2s ease-in-out;
  }

  a.marketplace-styling:hover {
    background: rgba(54, 95, 238, 0.15);
    color: #1e3bb8 !important;
    cursor: pointer;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(54, 95, 238, 0.2);
  }
</style>
