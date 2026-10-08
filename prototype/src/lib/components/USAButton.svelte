<!-- lib/components/USAButton.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  // Note: if you want to pass in a function that returns something, please first wrap
  // it around an anonymous function wrapper. This is for securing this component, b/c
  // USAButton has no idea what the parent component is doing, nor should it care
  // e.g. <USAButton handleClick={() => {copyToClipboard(id)}}>
  // Note: When user clicks on this button, on:click will pass MouseEvent as first argument
  // to downstream callee functions whether they use it or not
  interface Props extends HTMLAttributes<HTMLButtonElement> {
    kind?: 'default' | 'secondary' | 'accent-cool' | 'base' | 'outline' | 'outline-inverse';
    disabled?: boolean;
    ariaDisabled?: boolean; // Note that aria-disabled USWDS buttons functions slightly different from disabled (e.g. focusable)
    big?: boolean;
    unstyled?: boolean;
    marketplace?: boolean;
    handleClick?: (event?: MouseEvent) => void | Promise<void>;
    children?: Snippet;
  }

  let {
    kind = 'default',
    disabled = false,
    ariaDisabled = false,
    big = false,
    unstyled = false,
    marketplace = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleClick = (event: MouseEvent | undefined) => {
      // Default empty handler; do nothing
    },
    children,
    ...restProps
  }: Props = $props();
</script>

<button
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
  {disabled}
  class:aria-disabled={ariaDisabled}
  onclick={handleClick}
  {...restProps}
>
  {@render children?.()}
</button>
