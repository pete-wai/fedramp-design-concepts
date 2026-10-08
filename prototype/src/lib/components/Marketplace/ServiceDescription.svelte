<!-- lib/components/Marketplace/ServiceDescription.svelte -->
<script lang="ts">
  import { processMarkdownSanitized } from '$lib/utils/renderMarkdown';

  let { text = '' }: { text: string } = $props();

  let rendered = $state('');

  $effect(() => {
    if (!text) {
      rendered = '';
      return;
    }

    processMarkdownSanitized(text).then((html) => {
      rendered = html;
    });
  });
</script>

<div id="service-description">
  <!-- eslint-disable-next-line -->
  {@html rendered}
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  #service-description {
    color: uswds.color('base-darkest');
  }
</style>
