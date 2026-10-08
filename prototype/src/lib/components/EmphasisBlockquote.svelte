<!-- lib/components/EmphasisBlockquote.svelte -->
<script lang="ts">
  import { processMarkdown } from '$lib/utils/renderMarkdown';
  import { onMount } from 'svelte';
  export let source: string = '';
  export let text: string = '';

  let renderedMarkdown = '';

  onMount(() => {
    processMarkdown(text).then((result) => {
      renderedMarkdown = result;
    });
  });
</script>

<blockquote>
  <span class="left-large-quotation-mark">“</span>
  <span class="quote">{@html renderedMarkdown}</span>
  <span class="right-large-quotation-mark">”</span>
  <span class="quote-source">— {source}</span>
</blockquote>

<style>
  blockquote {
    padding: 1em;
    margin: 1em 0;
    padding-left: 6em;
    padding-right: 5em;
  }

  .quote {
    font-style: italic;
  }

  .left-large-quotation-mark {
    font-size: 10rem;
    position: absolute;
    left: 0.2em;
    line-height: 0.5;
  }

  .right-large-quotation-mark {
    font-size: 10rem;
    position: absolute;
    right: 1.8em;
    line-height: 0.5;
  }
  @media (max-width: 39.99em) {
    .right-large-quotation-mark {
      right: 0.2em;
    }
  }
</style>
