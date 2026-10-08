<!-- lib/components/BackToTop.svelte -->
<script>
  import { asset } from '$lib/utils/paths';
  import { onMount } from 'svelte';

  let scrollY = $state(0);
  let threshold = $state(250);

  // Derived state based on scroll position
  let isVisible = $derived(scrollY > threshold);

  onMount(() => {
    const scrollFunction = () => {
      scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    };

    window.addEventListener('scroll', scrollFunction);

    return () => {
      window.removeEventListener('scroll', scrollFunction);
    };
  });

  function topFunction() {
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
</script>

<button onclick={topFunction} title="Back to top" class="back-to-top" class:visible={isVisible}>
  <svg class="usa-icon" aria-hidden="true" focusable="false" role="img">
    <use href={asset('/uswds/img/sprite.svg#arrow_upward')}></use>
  </svg>
  Top
</button>

<style>
  .back-to-top {
    position: fixed;
    bottom: 30px;
    right: 50px;
    z-index: 99;
    font-size: 14px;
    font-weight: 700;
    border: none;
    outline: none;
    background-color: rgba(110, 22, 78, 0.7);
    color: #f5f5fa;
    cursor: pointer;
    padding: 8px 20px;
    border-radius: 6px;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    /* Fade animation properties */
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px); /* Slide up effect */
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
  }

  .back-to-top.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .back-to-top:hover {
    background-color: rgba(110, 22, 78, 0.9);
    transform: translateY(-2px);
  }

  .back-to-top.visible:hover {
    transform: translateY(-2px);
  }

  /* SVG sizing */
  .back-to-top .usa-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  /* Make the text closer to the side on smaller screens */
  @media (max-width: 1023.99px) {
    .back-to-top {
      bottom: 25px;
      right: 25px;
    }
  }

  /* Hide text on tablet */
  @media (max-width: 639.99px) {
    .back-to-top {
      font-size: 0;
      padding: 0.75rem;
      gap: 0;
    }

    .back-to-top .usa-icon {
      width: 2rem;
      height: 2rem;
    }
  }

  /* Mobile-lg screen */
  @media (max-width: 479.99px) {
    .back-to-top {
      bottom: 15px;
      right: 15px;
      padding: 10px;
    }

    .back-to-top .usa-icon {
      width: 1.875rem;
      height: 1.875rem;
    }
  }
</style>
