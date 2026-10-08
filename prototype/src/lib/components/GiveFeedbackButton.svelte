<!-- lib/components/GiveFeedbackButton.svelte -->
<script lang="ts">
  /**
   * @type {string} Unique id for a client-side script to target to create feedback form.
   */
  export let formId: string;

  /**
   * @type {string} The text to display on the feedback button.
   */
  export let buttonText = 'Give Feedback';
</script>

<!--
  This button component is designed to be sticky on the right side of the viewport.
-->
<a href="https://www.fedramp.gov/marketplace/" class="usa-button usa-button--primary feedback-button" id={formId} aria-label={buttonText}>
  <span class="feedback-text">{buttonText}</span>
</a>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .feedback-button {
    // Positioning: Fixed to the right edge, vertically centered
    position: fixed;
    right: 0;
    top: 50%;
    /*
      translateY(-50%) centers the button vertically.
      rotate(-90deg) rotates the button 90 degrees counter-clockwise,
      making the text read vertically from top to bottom along the right edge.
    */
    transform: translateY(-50%) rotate(-90deg);
    /*
      transform-origin: 100% 75% ensures the rotation pivots around
      the middle of the button's right edge, making it appear to swing out
      from the page's right side.
    */
    transform-origin: 100% 75%;
    z-index: 1000; // Ensures the button is on top of other content

    /* Text and Layout */
    white-space: nowrap; // Prevents the button text from wrapping
    padding: uswds.units('105') uswds.units(2.5);
    min-width: 100px; // Ensures a consistent minimum width before rotation

    /* Appearance Adjustments:
       USWDS buttons have a default border-radius. By setting
       border-radius: var(--usa-radius-md) var(--usa-radius-md) 0 0;
       BEFORE rotation, it means the top-left and top-right corners are rounded,
       and the bottom corners are sharp.
       After -90deg rotation, this results in the left side (facing into the page)
       being rounded, and the right side (facing the viewport edge) being sharp,
       creating a common "tab" aesthetic.
    */
    border-radius: uswds.units(2) uswds.units(2) 0 0;

    /* For centering display text */
    display: flex;
    align-items: center; // Vertically center the content (the span)
    justify-content: center; // Horizontally center the content (the span)

    // These properties explicitly tell the browser how to render fonts.
    // '-webkit-font-smoothing' is for WebKit browsers (Chrome, Safari, Edge).
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale; // For Firefox on macOS
  }

  @media (max-width: uswds.units('desktop')) {
    .feedback-button {
      // Don't hide it, instead, reposition for mobile
      display: block;
      position: fixed;
      bottom: uswds.units(2); // Position at the bottom
      left: uswds.units(2); // Position on the left; bottom-right has the back-to-top button
      right: auto; // Reset 'right' from desktop styles
      top: auto; // Remove top positioning
      transform: none; // Remove rotation for better readability
      border-radius: uswds.units(1); // Standard button corners
      z-index: 1000;
      // Slightly smaller padding/font size for mobile
      padding: uswds.units(1.5) uswds.units(2);
      width: fit-content;
    }
  }
</style>
