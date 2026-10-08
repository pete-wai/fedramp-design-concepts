<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    phaseNumber: number;
    phaseName: string;
    status: 'COMPLETED' | 'ACTIVE' | 'FUTURE';
    timeline: string;
    deliveryGoal: string;
    outcome?: string;
    expanded: boolean;
    onToggle: () => void;
    children?: Snippet;
  }

  let { phaseNumber, phaseName, status, timeline, deliveryGoal, outcome, expanded, onToggle, children }: Props = $props();

  let panelId = $derived(`phase-${phaseNumber}-panel`);
  let buttonId = $derived(`phase-${phaseNumber}-button`);
</script>

<article class="phase-item phase-{status.toLowerCase()}" class:expanded class:collapsed={!expanded}>
  {#if children}
    <h3 class="phase-heading">
      <button id={buttonId} type="button" class="phase-toggle" aria-expanded={expanded} aria-controls={panelId} onclick={onToggle}>
        <span class="summary-copy">
          <span class="summary-row">
            <span class="phase-eyebrow">Phase {phaseNumber}</span>
            <span class="status-badge status-{status.toLowerCase()}">{status}</span>
          </span>
          <span class="summary-main">
            <span class="phase-name">{phaseName}</span>
            <span class="timeline-string">{timeline}</span>
          </span>
        </span>
        <span class="chevron" aria-hidden="true">↓</span>
      </button>
    </h3>
  {:else}
    <div class="phase-toggle phase-toggle-static">
      <span class="summary-copy">
        <span class="summary-row">
          <span class="phase-eyebrow">Phase {phaseNumber}</span>
          <span class="status-badge status-{status.toLowerCase()}">{status}</span>
        </span>
        <span class="summary-main">
          <span class="phase-name">{phaseName}</span>
          <span class="timeline-string">{timeline}</span>
        </span>
      </span>
    </div>
  {/if}

  <div class="phase-facts">
    <div class="goal-section">
      <p class="label">Delivery goal</p>
      <p class="value">{deliveryGoal}</p>
    </div>
    {#if outcome}
      <div class="outcome-section">
        <p class="label">Outcome</p>
        <p class="value">{outcome}</p>
      </div>
    {/if}
  </div>

  {#if children}
    <div id={panelId} class="expandable-content" role="region" aria-labelledby={buttonId} aria-hidden={!expanded} inert={!expanded}>
      <div class="inner">
        <div class="recap-section">
          {@render children()}
        </div>
      </div>
    </div>
  {/if}
</article>

<style lang="scss">
  .phase-item {
    margin: 0 0 0.9rem;
    overflow: clip;
    background: linear-gradient(135deg, rgba(196, 160, 232, 0.045), transparent 42%), var(--tx-surface-raised);
    border: 1px solid var(--tx-border);
    border-radius: 14px;
    box-shadow: 0 14px 36px rgba(7, 3, 10, 0.2);
    transition:
      border-color 220ms ease,
      background-color 220ms ease,
      box-shadow 220ms ease,
      opacity 220ms ease;
  }

  .phase-item:hover {
    border-color: var(--tx-border-strong);
  }

  .phase-heading {
    margin: 0;
    font: inherit;
  }

  .phase-toggle {
    position: relative;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.4rem 0.9rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .phase-toggle-static {
    cursor: default;
  }

  .phase-toggle:focus-visible {
    outline: 3px solid var(--tx-accent-warm);
    outline-offset: -4px;
    border-radius: 12px;
  }

  .summary-copy,
  .summary-row,
  .summary-main {
    display: flex;
  }

  .summary-copy {
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.5rem;
  }

  .summary-row {
    align-items: center;
    gap: 0.65rem;
  }

  .summary-main {
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.8rem;
  }

  .phase-eyebrow,
  .label {
    margin: 0;
    color: var(--tx-text-secondary);
    font-family: var(--tx-font-mono);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .phase-name {
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 750;
    line-height: 1.25;
  }

  .timeline-string {
    color: var(--tx-text-secondary);
    font-family: var(--tx-font-mono);
    font-size: 0.76rem;
    white-space: nowrap;
  }

  .status-badge {
    padding: 0.22rem 0.62rem;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-family: var(--tx-font-mono);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1;
  }

  .status-completed {
    color: var(--tx-status-completed);
    background: rgba(156, 163, 175, 0.1);
  }

  .status-active {
    color: var(--tx-status-active);
    background: rgba(117, 217, 158, 0.12);
  }

  .status-future {
    color: var(--tx-future-text);
    background: rgba(136, 136, 153, 0.08);
  }

  .chevron {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: 0 0 2rem;
    place-items: center;
    border: 1px solid var(--tx-border);
    border-radius: 50%;
    color: var(--tx-accent-warm);
    font-size: 1rem;
    transition:
      transform 260ms ease,
      border-color 180ms ease,
      background-color 180ms ease;
  }

  .expanded .chevron {
    transform: rotate(180deg);
    background: rgba(255, 146, 72, 0.1);
  }

  .phase-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    margin: 0 1.4rem;
    padding: 0.9rem 0 1.2rem;
    border-top: 1px solid var(--tx-border);
  }

  .goal-section:only-child {
    grid-column: 1 / -1;
  }

  .value {
    margin: 0.35rem 0 0;
    color: var(--tx-text-primary);
    font-size: 0.88rem;
    line-height: 1.55;
  }

  .expandable-content {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 320ms ease,
      opacity 240ms ease;
  }

  .expanded .expandable-content {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .inner {
    min-height: 0;
    overflow: hidden;
    padding: 0 1.4rem 1.5rem;
  }

  .recap-section {
    padding-top: 1.35rem;
    border-top: 1px solid var(--tx-border);
  }

  .phase-completed {
    opacity: 0.82;
  }

  .phase-completed.expanded,
  .phase-completed:focus-within,
  .phase-completed:hover {
    opacity: 1;
  }

  .phase-active {
    background: linear-gradient(135deg, rgba(196, 160, 232, 0.09), transparent 50%), var(--tx-surface-raised);
    border-color: rgba(196, 160, 232, 0.62);
    border-left: 3px solid var(--tx-accent-warm);
    box-shadow:
      0 16px 42px rgba(7, 3, 10, 0.28),
      0 0 22px rgba(196, 160, 232, 0.07);
  }

  .phase-active .phase-name,
  .phase-active .phase-eyebrow {
    color: var(--tx-text-primary);
  }

  .phase-active .status-active {
    color: var(--tx-accent-warm-light);
    background: rgba(255, 146, 72, 0.09);
  }

  .phase-active .chevron {
    border-color: rgba(196, 160, 232, 0.5);
    color: var(--tx-accent-warm-light);
  }

  .phase-active.expanded {
    background: linear-gradient(135deg, rgba(196, 160, 232, 0.13), rgba(42, 26, 53, 0.88) 55%), var(--tx-surface-raised);
    border-color: rgba(196, 160, 232, 0.78);
    border-left-color: var(--tx-accent-warm);
    box-shadow:
      0 20px 52px rgba(7, 3, 10, 0.34),
      0 0 28px rgba(196, 160, 232, 0.1);
  }

  .phase-future {
    border-style: dashed;
    opacity: 0.66;
    filter: saturate(0.3);
  }

  .phase-future:hover {
    opacity: 0.82;
  }

  @media (max-width: 640px) {
    .phase-toggle {
      align-items: flex-start;
      gap: 0.75rem;
      padding-right: 1rem;
      padding-left: 1rem;
    }

    .summary-main {
      align-items: flex-start;
      flex-direction: column;
    }

    .timeline-string {
      white-space: normal;
    }

    .chevron {
      width: 1.8rem;
      height: 1.8rem;
      flex-basis: 1.8rem;
    }

    .phase-facts {
      grid-template-columns: 1fr;
      margin-right: 1rem;
      margin-left: 1rem;
    }

    .inner {
      padding-right: 1rem;
      padding-left: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .phase-item,
    .chevron,
    .expandable-content {
      transition: none;
    }
  }
</style>
