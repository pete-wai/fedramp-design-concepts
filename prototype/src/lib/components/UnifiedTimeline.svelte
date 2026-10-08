<script lang="ts">
  interface TimelineEvent {
    date: string;
    title: string;
    text?: string;
    color: string;
    type: 'history' | 'phase';
    status: 'completed' | 'active' | 'future';
    phaseNumber?: number;
  }

  interface Props {
    events: TimelineEvent[];
    compact?: boolean;
    ariaLabel?: string;
  }

  let { events = [], compact = false, ariaLabel = 'FedRAMP 20x timeline' }: Props = $props();
</script>

<div class="unified-timeline" class:compact aria-label={ariaLabel}>
  {#each events as event, i (event.date + event.title)}
    <div class="tl-event tl-{event.status}" class:tl-history={event.type === 'history'}>
      <div class="tl-rail" aria-hidden="true">
        <div class="tl-dot" style="--dot-color: {event.status === 'future' ? 'var(--tx-timeline-future)' : event.color};"></div>
        {#if i < events.length - 1}
          <div
            class="tl-line"
            class:tl-line-dashed={events[i + 1]?.status === 'future' || event.status === 'future'}
            style="--line-color: {event.status === 'future' ? 'var(--tx-timeline-future)' : event.color};"
          ></div>
        {/if}
      </div>
      <div class="tl-content">
        <div class="tl-date">{event.date}</div>
        <div class="tl-title">{event.title}</div>
        {#if !compact && event.text}
          <div class="tl-text">{event.text}</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .unified-timeline {
    position: relative;
    padding: 0.4rem 0;
  }

  .tl-event {
    position: relative;
    display: flex;
  }

  .tl-future {
    opacity: 0.62;
  }

  .tl-rail {
    display: flex;
    width: 34px;
    flex: 0 0 34px;
    flex-direction: column;
    align-items: center;
  }

  .tl-dot {
    position: relative;
    z-index: 2;
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
    margin-top: 3px;
    border: 2px solid var(--dot-color);
    border-radius: 50%;
    background: var(--dot-color);
  }

  .tl-active .tl-dot {
    width: 16px;
    height: 16px;
    flex-basis: 16px;
    box-shadow:
      0 0 0 4px rgba(163, 193, 79, 0.2),
      0 0 15px rgba(163, 193, 79, 0.45);
    animation: pulse-glow 2.5s ease-in-out infinite;
  }

  .tl-future .tl-dot {
    background: transparent;
  }

  .tl-line {
    width: 2px;
    min-height: 1.8rem;
    flex: 1;
    margin: 4px 0;
    background: var(--line-color);
  }

  .tl-line-dashed {
    width: 0;
    border-left: 2px dashed var(--tx-timeline-future);
    background: none;
  }

  .tl-content {
    min-width: 0;
    flex: 1;
    padding: 0 0 1.65rem 0.65rem;
  }

  .tl-date {
    margin-bottom: 0.18rem;
    color: var(--tx-text-secondary);
    font-family: var(--tx-font-mono);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .tl-title {
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .tl-text {
    margin-top: 0.35rem;
    color: var(--tx-text-secondary);
    font-family: var(--tx-font-sans);
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .tl-future .tl-date,
  .tl-future .tl-title,
  .tl-future .tl-text {
    color: var(--tx-future-text);
  }

  .compact .tl-content {
    padding-bottom: 1.15rem;
  }

  .compact .tl-title {
    font-size: 0.76rem;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow:
        0 0 0 4px rgba(163, 193, 79, 0.18),
        0 0 10px rgba(163, 193, 79, 0.3);
    }
    50% {
      box-shadow:
        0 0 0 7px rgba(163, 193, 79, 0.28),
        0 0 22px rgba(163, 193, 79, 0.48);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tl-active .tl-dot {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .tl-rail {
      width: 30px;
      flex-basis: 30px;
    }

    .tl-content {
      padding-right: 0.25rem;
      padding-bottom: 1.35rem;
      padding-left: 0.55rem;
    }

    .tl-title {
      font-size: 0.86rem;
    }

    .tl-text {
      font-size: 0.8rem;
    }
  }
</style>
