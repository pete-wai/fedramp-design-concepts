<!-- lib/components/CopyableText.svelte -->
<script lang="ts">
  import { asset } from '$lib/utils/paths';
  import { copyToClipboard } from '$lib/utils/copyToClipboard';
  import type { Snippet } from 'svelte';

  type Props = {
    /** The text to be copied. */
    textToCopy: string;
    /** The message to show in the toast notification on successful copy. */
    customSuccessMessage?: string;
    /** Duration in milliseconds for the success message to display. */
    toastDuration?: number;
    /** Size of the copy icon (e.g., '18px', '1.25rem'). */
    iconSize?: string;
    /** Color of the copy icon. Defaults to `currentColor` to inherit parent text color. */
    iconColor?: string;
    /** Color of the copy icon on hover or focus. Uses USWDS primary-dark by default. */
    iconHoverColor?: string;
    children?: Snippet;
  };

  let {
    textToCopy,
    customSuccessMessage = undefined,
    toastDuration = 3000,
    iconSize = '18px',
    iconColor = 'currentColor',
    iconHoverColor = 'var(--usa-color-primary-dark)',
    children
  }: Props = $props();

  let contentRef: HTMLElement | undefined = $state<HTMLElement | undefined>(undefined);

  // Derive the actual text to copy — prefer explicit prop, fall back to slot text content.
  let actualTextToCopy: string | undefined = $derived(textToCopy !== undefined ? textToCopy : contentRef?.textContent?.trim());

  let successMessage: string = $derived(customSuccessMessage ?? `"${actualTextToCopy}" copied to clipboard!`);
</script>

<!-- The main wrapper makes the component inline-flex -->
<span class="copyable-text-wrapper" style="--icon-size: {iconSize}; --icon-color: {iconColor}; --icon-hover-color: {iconHoverColor};">
  <!-- This span holds the text content, either from slot or explicitly set -->
  <span bind:this={contentRef} class="copyable-text-content">
    {@render children?.()}
  </span>
  <!-- The copy button -->
  <button
    type="button"
    class="copy-button"
    onclick={() => copyToClipboard(textToCopy, toastDuration, successMessage)}
    aria-label="Copy {textToCopy} to clipboard"
  >
    <svg class="usa-icon" aria-hidden="true" focusable="false" role="img">
      <use href={asset('/uswds/img/sprite.svg#content_copy')}></use>
    </svg>
  </button>
</span>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .copyable-text-wrapper {
    display: inline-flex; // Makes the wrapper inline and allows children to be flex items
    align-items: center; // Vertically centers the text and the button
    gap: 0.25rem; // Small gap between text and icon */
    // Allow white-space to wrap
    white-space: normal;
    // Allow the wrapper to shrink within its container so long, unbreakable
    // content (e.g. email addresses) can wrap instead of overflowing.
    max-width: 100%;
  }

  // Let the text child shrink below its intrinsic width so overflow-wrap /
  // word-break on the inner content can take effect inside the flex layout.
  .copyable-text-content {
    min-width: 0;
    overflow-wrap: break-word;
  }

  .copy-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    flex-shrink: 0; // Keep the copy icon at full size when text wraps
    display: flex; // To center the SVG within the button
    align-items: center;
    justify-content: center;
    line-height: 1; // Ensures the button doesn't add extra vertical space
    color: var(--icon-color); // Default icon color, using CSS variable
    transition: color 0.15s ease-in-out; // Smooth color change on hover/focus

    &:hover,
    &:focus-visible {
      // Use :focus-visible for better accessibility (only shows outline on keyboard focus)
      color: var(--icon-hover-color); // Hover/focus icon color, using CSS variable
      outline-offset: 2px;
      border-radius: 2px; // Match USWDS button focus style
    }
    /* Hide default outline when element is focused by mouse but not keyboard */
    &:focus:not(:focus-visible) {
      outline: none;
    }
  }

  .usa-icon {
    width: var(--icon-size);
    height: var(--icon-size);
    fill: currentColor; // Ensures the SVG inherits the color set on the button
    pointer-events: none; // Allows clicks to pass through the SVG to the button
  }
</style>
