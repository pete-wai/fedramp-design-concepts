<!-- lib/components/ColorfulBlockquote.svelte -->
<script lang="ts">
  import { processMarkdown } from '$lib/utils/renderMarkdown';
  import { onMount } from 'svelte';
  export let color = 'yellow'; // default color
  export let text = '';

  let renderedMarkdown = '';

  // Links to prerendered file endpoints (e.g. /notices/rss.xml) must trigger a
  // full-document navigation. Otherwise SvelteKit's client router rewrites them
  // to a trailing-slash form (root layout uses trailingSlash: 'always'), which
  // resolves to a nonexistent directory and 404s. Mark file-extension links with
  // data-sveltekit-reload so the browser fetches the literal file instead.
  const addReloadToFileLinks = (html: string): string =>
    html.replace(/<a\s+([^>]*href="[^"]*\.[a-z0-9]+"[^>]*)>/gi, (match, attrs) =>
      /data-sveltekit-reload/i.test(attrs) ? match : `<a ${attrs} data-sveltekit-reload>`
    );

  onMount(() => {
    processMarkdown(text).then((result) => {
      renderedMarkdown = addReloadToFileLinks(result);
    });
  });
</script>

<blockquote style={`--colorful-blockquote-bg: ${color};`}>
  {@html renderedMarkdown}
</blockquote>

<style>
  blockquote {
    background: var(--colorful-blockquote-bg, #fff);
    border-left: 4px solid color-mix(in srgb, var(--colorful-blockquote-bg, #fff) 80%, black 20%);
    padding: 1em;
    margin: 1em 0;
    border-radius: 0.25em;
  }
</style>
