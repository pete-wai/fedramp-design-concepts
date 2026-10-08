<!-- lib/components/Tooltip.svelte -->
<script lang="ts">
  import { asset } from '$lib/utils/paths';
  import { onMount } from 'svelte';

  interface Props {
    text: string;
    ariaLabel: string;
    iconSize?: string;
    iconColor?: string;
    hoverColor?: string;
    position?: string;
    anchorClass?: string;
    closeDelay?: number;
    colorMode?: 'light' | 'dark';
  }

  let {
    text,
    ariaLabel,
    iconSize,
    iconColor,
    hoverColor,
    position = 'top',
    anchorClass,
    closeDelay = 300,
    colorMode = 'dark' // Default to dark mode
  }: Props = $props();

  let tooltipElement: HTMLElement;
  let containerElement: HTMLElement;
  let iconElement: HTMLElement;
  let currentPosition = $state('top');
  let isVisible = $state(false);
  let keyboardActive = $state(false);
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let updatePosition: (() => void) | null = null;

  const BREAKPOINTS = {
    WIDESCREEN: 1400,
    DESKTOP_LG: 1200,
    DESKTOP: 1024,
    TABLET: 640
  };

  function showTooltip(type: 'mouse' | 'keyboard' = 'mouse') {
    if (keyboardActive && type === 'mouse') return;
    if (type === 'keyboard') keyboardActive = true;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    updatePosition?.();
    isVisible = true;
  }

  function hideTooltip(type: 'mouse' | 'keyboard' = 'mouse') {
    if (keyboardActive && type === 'mouse') return;
    hideTimeout = setTimeout(() => {
      isVisible = false;
      hideTimeout = null;
      if (type === 'keyboard') keyboardActive = false;
    }, closeDelay);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      isVisible = false;
      keyboardActive = false;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }
  }

  function handleMouseMove() {
    if (keyboardActive) keyboardActive = false;
  }

  function parsePositions(positionString: string): Record<string, string> {
    if (!positionString.includes(':')) {
      return { default: positionString };
    }
    return Object.fromEntries(
      positionString
        .split(' ')
        .map((part) => part.split(':'))
        .filter(([breakpoint, pos]) => breakpoint && pos)
        .map(([breakpoint, pos]) => [breakpoint.trim(), pos.trim()])
    );
  }

  function getPositionForBreakpoint(positions: Record<string, string>, preferenceOrder: string[]): string {
    return preferenceOrder.find((pref) => positions[pref]) ? positions[preferenceOrder.find((pref) => positions[pref])!] : positions.default || 'top';
  }

  function updatePositionForScreenSize() {
    if (typeof window === 'undefined') return;
    const positions = parsePositions(position);
    const width = window.innerWidth;

    if (width >= BREAKPOINTS.WIDESCREEN) {
      currentPosition = getPositionForBreakpoint(positions, ['widescreen']);
    } else if (width >= BREAKPOINTS.DESKTOP_LG) {
      currentPosition = getPositionForBreakpoint(positions, ['desktop-lg']);
    } else if (width >= BREAKPOINTS.DESKTOP) {
      currentPosition = getPositionForBreakpoint(positions, ['desktop']);
    } else if (width >= BREAKPOINTS.TABLET) {
      currentPosition = getPositionForBreakpoint(positions, ['tablet']);
    } else {
      currentPosition = getPositionForBreakpoint(positions, ['mobile', 'tablet', 'desktop', 'desktop-lg', 'widescreen']);
    }
  }

  function findAnchorElement(): Element | null {
    if (!anchorClass || !containerElement) return null;
    return containerElement.closest(`.${anchorClass}`);
  }

  function setupAnchorPositioning() {
    if (!anchorClass) return;

    updatePosition = () => {
      const anchorElement = findAnchorElement();
      if (!anchorElement || !containerElement) {
        return;
      }

      const rect = anchorElement.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      const props = {
        '--anchor-top': `${rect.top}px`,
        '--anchor-bottom': `${rect.bottom}px`,
        '--anchor-left': `${rect.left}px`,
        '--anchor-right': `${rect.right}px`,
        '--anchor-width': `${rect.width}px`,
        '--anchor-height': `${rect.height}px`
      };

      Object.entries(props).forEach(([prop, value]) => {
        containerElement.style.setProperty(prop, value);
      });
    };

    updatePosition();

    const handleResize = () => {
      updatePosition?.();
      updatePositionForScreenSize();
    };

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition!);
      window.removeEventListener('resize', handleResize);
    };
  }

  onMount(() => {
    updatePositionForScreenSize();
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    const cleanupAnchor = setupAnchorPositioning();

    if (!anchorClass) {
      const handleResize = () => updatePositionForScreenSize();
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (hideTimeout) clearTimeout(hideTimeout);
      };
    }

    return () => {
      cleanupAnchor?.();
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  });

  $effect(() => {
    if (containerElement) {
      if (iconSize) {
        containerElement.style.setProperty('--icon-size', iconSize);
      }
      if (iconColor) {
        containerElement.style.setProperty('--icon-color', iconColor);
      }
      if (hoverColor) {
        containerElement.style.setProperty('--hover-color', hoverColor);
      }
    }
  });

  const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="tooltip-container" class:anchored={anchorClass} bind:this={containerElement}>
  <button
    class="tooltip-button"
    aria-describedby={tooltipId}
    aria-expanded={isVisible}
    bind:this={iconElement}
    onmouseenter={() => showTooltip('mouse')}
    onmouseleave={() => hideTooltip('mouse')}
    onfocus={() => showTooltip('keyboard')}
    onblur={() => hideTooltip('keyboard')}
    onkeydown={handleKeydown}
    type="button"
  >
    <svg
      class="usa-icon"
      aria-label="Info icon"
      aria-hidden="true"
      focusable="false"
      role="img"
      style="color: {colorMode === 'light' ? 'white' : 'var(--icon-color, #7a1857)'}"
    >
      <use href={asset('/uswds/img/sprite.svg#info')}></use>
    </svg>
    <span class="usa-sr-only">{ariaLabel}</span>
  </button>
  <div
    class="tooltip tooltip-{currentPosition}"
    class:visible={isVisible}
    class:light-mode={colorMode === 'light'}
    aria-hidden={!isVisible}
    role="tooltip"
    id={tooltipId}
    bind:this={tooltipElement}
    onmouseenter={() => showTooltip('mouse')}
    onmouseleave={() => hideTooltip('mouse')}
  >
    {text}
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .tooltip-container {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .tooltip-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;

    &:focus {
      outline: 2px solid uswds.color('primary-vivid');
      outline-offset: 2px;
    }
  }

  .usa-icon {
    width: var(--icon-size, 18px);
    height: var(--icon-size, 18px);
    transition: color 0.2s ease;
    color: var(--icon-color, uswds.color('primary-vivid'));
    pointer-events: none;
  }

  .tooltip-button:hover .usa-icon,
  .tooltip-button:focus .usa-icon {
    color: var(--hover-color, uswds.color('primary-dark'));
  }

  .tooltip {
    position: absolute;
    background-color: uswds.color('base-dark');
    color: uswds.color('base-lightest');
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: normal;
    line-height: 1.4;
    white-space: normal;
    max-width: 250px;
    text-align: left;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transition:
      opacity 0.3s,
      visibility 0.3s;
    z-index: 100000;
    user-select: text;
    cursor: text;

    &.visible {
      opacity: 1;
      visibility: visible;
    }

    &[aria-hidden='true'] {
      pointer-events: none;
    }
  }

  // Light Mode Styles
  .tooltip.light-mode {
    background-color: uswds.color('base-lightest');
    color: uswds.color('base-dark');
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); // Lighter shadow
    border: 1px solid uswds.color('base-dark');
  }
  .tooltip.light-mode .tooltip-container .tooltip-button .usa-icon {
    color: white !important;
  }
  .tooltip-container:not(.anchored) {
    .tooltip-top {
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: uswds.color('base-dark');
      }
    }

    .tooltip-bottom {
      top: 125%;
      left: 50%;
      transform: translateX(-50%);

      &::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-bottom-color: uswds.color('base-dark');
      }
    }

    .tooltip-left {
      right: 125%;
      top: 50%;
      transform: translateY(-50%);

      &::after {
        content: '';
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-left-color: uswds.color('base-dark');
      }
    }

    .tooltip-right {
      left: 125%;
      top: 50%;
      transform: translateY(-50%);

      &::after {
        content: '';
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-right-color: uswds.color('base-dark');
      }
    }
  }

  .tooltip-container.anchored {
    .tooltip {
      position: fixed;
    }

    .tooltip-top {
      bottom: calc(100vh - var(--anchor-top) + 10px);
      left: var(--anchor-left);
      width: var(--anchor-width);
      max-width: var(--anchor-width);

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 20px;
        border: 5px solid transparent;
        border-top-color: uswds.color('base-dark');
      }
    }

    .tooltip-bottom {
      top: calc(var(--anchor-bottom) + 10px);
      left: var(--anchor-left);
      width: var(--anchor-width);
      max-width: var(--anchor-width);

      &::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 20px;
        border: 5px solid transparent;
        border-bottom-color: uswds.color('base-dark');
      }
    }

    .tooltip-left {
      right: calc(100vw - var(--anchor-left) + 10px);
      top: var(--anchor-top);
      max-width: 250px;

      &::after {
        content: '';
        position: absolute;
        left: 100%;
        top: 20px;
        border: 5px solid transparent;
        border-left-color: uswds.color('base-dark');
      }
    }

    .tooltip-right {
      left: calc(var(--anchor-right) + 10px);
      top: var(--anchor-top);
      max-width: 250px;

      &::after {
        content: '';
        position: absolute;
        right: 100%;
        top: 20px;
        border: 5px solid transparent;
        border-right-color: uswds.color('base-dark');
      }
    }
  }
</style>
