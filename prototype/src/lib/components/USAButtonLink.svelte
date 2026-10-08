<!-- lib/components/USAButtonLink.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLAnchorElement> {
    kind?: 'default' | 'secondary' | 'accent-cool' | 'base' | 'outline' | 'outline-inverse';
    big?: boolean;
    unstyled?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    marketplace?: boolean;
    children?: Snippet;
    bgColor?: string;
    bgColorVisited?: string;
    bgColorHover?: string;
  }

  let {
    kind = 'default',
    big = false,
    unstyled = false,
    href = undefined,
    target = '_blank',
    rel = 'noopener noreferrer', // Default to opening to new tab and not provide referrer information to target resource for privacy and security
    marketplace = false,
    children,
    bgColor,
    bgColorVisited,
    bgColorHover,
    ...restProps
  }: Props = $props();

  const customStyles = $derived(
    [
      bgColor && `--button-bg-color: ${bgColor}`,
      bgColorVisited && `--button-bg-color-visited: ${bgColorVisited}`,
      bgColorHover && `--button-bg-color-hover: ${bgColorHover}`
    ]
      .filter(Boolean)
      .join('; ')
  );
</script>

<a
  {href}
  {target}
  {rel}
  class:usa-button={true}
  class:usa-button--secondary={kind === 'secondary'}
  class:usa-button--accent-cool={kind === 'accent-cool'}
  class:usa-button--base={kind === 'base'}
  class:usa-button--outline={kind === 'outline' || kind === 'outline-inverse'}
  class:usa-button--inverse={kind === 'outline-inverse'}
  class:usa-button--big={big}
  class:usa-button--unstyled={unstyled}
  class:marketplace-button={marketplace}
  class:marketplace-button--outline={marketplace && kind === 'outline'}
  class:custom-colors={bgColor || bgColorVisited || bgColorHover}
  style={customStyles}
  {...restProps}
>
  {@render children?.()}
</a>

<style lang="scss">
  .usa-button.custom-colors {
    background-color: var(--button-bg-color);

    &:visited {
      background-color: var(--button-bg-color-visited, var(--button-bg-color));
    }

    &:hover,
    &:focus {
      background-color: var(--button-bg-color-hover, var(--button-bg-color));
    }
  }
</style>
