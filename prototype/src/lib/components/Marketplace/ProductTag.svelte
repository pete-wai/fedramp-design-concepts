<!-- lib/components/Marketplace/ProductTag.svelte -->
<script lang="ts">
  type Props = {
    category: string;
  };
  let { category }: Props = $props();

  let isRev5 = $derived(category.toLowerCase() === 'rev5');
</script>

<span class="product-tag" class:rev5={isRev5}>
  {String(category).charAt(0).toUpperCase() + String(category).slice(1)}
</span>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .product-tag {
    box-sizing: border-box;
    display: inline-flex;
    vertical-align: middle;
    justify-content: center;
    align-items: center;
    padding: 2px 15px;
    // Sized by its content with a floor, not a fixed width/height. The old
    // fixed 60px/70px x 30px box clipped the label when the tile is narrow
    // (the 2-column mobile StatsCard grid) or when text is zoomed to 200%.
    min-width: 60px;
    min-height: 30px;
    background: rgba(120, 43, 101, 0.15);
    border: 1px solid #782b65;
    border-radius: 5px;
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 25px;
    text-align: center;
    letter-spacing: 0.01em;
    color: #782b65;
    flex: none;

    // Rev5 colorway.
    &.rev5 {
      background: rgba(244, 146, 123, 0.15);
      border: 1px solid uswds.color('secondary-dark');
      color: uswds.color('secondary-dark');
    }
  }
</style>
