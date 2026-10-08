<!-- lib/components/Marketplace/StatsCard.svelte -->
<script lang="ts">
  import { asset } from '$lib/utils/paths';
  import Tooltip from '../Tooltip.svelte';
  import ProductTag from './ProductTag.svelte';
  import type { ProductCertType, ProductCertStatus, ProductCertClass, ProductPhase } from '$lib/types/marketplace';
  import { t } from '$lib/stores/L10nStore';
  import { displayCertStatus, displayCertType, displayCertClass } from '$lib/utils/marketplaceDisplay';
  import { formatMarketplaceDate } from '$lib/utils/dateUtils';

  // TODO: Hiding status content for initial Marketplace 2.0 launch b/c RFC feedback not finalized yet
  type StatsCardProps = {
    status: ProductCertStatus;
    statusDate: Date | null;
    certClass: ProductCertClass;
    certType: ProductCertType;
    authorizations: number;
    phase: ProductPhase;
    certPath: string;
    certifiedDate: Date | null;
  };

  let {
    status = $bindable('Unknown'),
    statusDate = $bindable(null),
    certClass = $bindable('Unknown'),
    certType = $bindable('Unknown'),
    authorizations = $bindable(0),
    phase = $bindable('Unknown'),
    certPath = $bindable('Unknown'),
    certifiedDate: certifiedDate = $bindable(null)
  }: StatsCardProps = $props();

  // "Authorized Since" is only meaningful once an offering is FedRAMP Certified.
  const isCertified = $derived(status === 'FedRAMP Certified' || status === 'FedRAMP Certified (In Remediation)');
  const certifiedSinceLabel = $derived(isCertified && certifiedDate ? formatMarketplaceDate(certifiedDate) : 'N/A');

  // const packageRequestDownloadUrl: string = asset('/resources/documents/Agency_Package_Request_Form.pdf');

  // "Initial Implementation" exists as both a lifecycle Phase and a legacy
  // status value (the data producer still emits it as a status). Only that exact
  // pairing is redundant, so we suppress the Status tile just when the status
  // itself is "Initial Implementation" (the Phase tile already conveys it).
  //
  // NOTE: this is intentionally keyed on `status`, not `phase`. Other
  // pre-certification statuses (Legacy FedRAMP Ready, Agency Authorization In Process,
  // FedRAMP In Process) also map to the Initial Implementation phase, but they
  // carry distinct, useful information and MUST still show in the Status tile.
  const showStatus = $derived(status !== 'Initial Implementation');

  const statusIcon: string = (() => {
    switch (status) {
      case 'FedRAMP Certified':
        return `${asset('/marketplace-icons/marketplace-approved.svg')}`;
      case 'FedRAMP Certified (In Remediation)':
        return `${asset('/marketplace-icons/marketplace-sync.svg')}`;
      case 'FedRAMP In Process':
        return `${asset('/marketplace-icons/three_quarters_progress_status.svg')}`;
      case 'Agency Authorization In Process':
        return `${asset('/marketplace-icons/half_progress_status.svg')}`;
      case 'Initial Implementation':
        return `${asset('/marketplace-icons/one_quarter_progress_status.svg')}`;
      case 'Legacy FedRAMP Ready':
        return `${asset('/marketplace-icons/one_quarter_progress_status.svg')}`;
      default:
        return '';
    }
  })();
</script>

<div class="stats-container">
  <div class="stats-grid">
    <!-- Phase -->
    <div class="stats-card">
      <div class="stats-card__header">
        <h2 class="margin-0">Phase</h2>
        <Tooltip text={t('tooltip-phase')} ariaLabel="More info about phase" position="widescreen:left desktop-lg:top" anchorClass="stats-card" />
      </div>
      <p class="margin-0 display-flex flex-align-center font-lg" id="phase-content">
        {phase === 'Unknown' ? 'N/A' : phase}
      </p>
    </div>

    <!-- Status -->
    <div class="stats-card position-relative">
      <div class="stats-card__header">
        <h2 class="margin-0" id="status-heading">Status</h2>
        <Tooltip
          text={t('tooltip-marketplace-status')}
          ariaLabel="More info about FedRAMP Status"
          position="widescreen:left desktop-lg:top"
          anchorClass="stats-card"
        />
      </div>
      {#if showStatus}
        <p class="margin-0 display-flex flex-align-center font-lg" id="status-content">
          <!-- TODO: This should be its own component with logic changing icon; not always certified -->
          <svg class="usa-icon margin-right-05" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
            <use href={statusIcon} x="1" y="1"></use>
          </svg>
          {displayCertStatus(status)}
        </p>
        {#if statusDate}
          <p class="margin-0" id="status-date">
            <i>As of {formatMarketplaceDate(statusDate)}</i>
          </p>
        {/if}
      {:else}
        <!-- Initial Implementation phase: no certification status yet. Avoid
             echoing the phase value in the Status tile. -->
        <p class="margin-0 display-flex flex-align-center font-lg" id="status-content">Not yet certified</p>
      {/if}
    </div>

    <!-- Authorizations -->
    <div class="stats-card">
      <div class="stats-card__header">
        <h2 class="margin-0">Authorizations</h2>
        <Tooltip
          text={t('tooltip-authorizations')}
          ariaLabel="More info about authorizations"
          position="widescreen:left desktop-lg:top"
          anchorClass="stats-card"
        />
      </div>
      <p class="margin-0 display-flex flex-align-center font-xl" id="authorizations-number">
        {authorizations}
      </p>
    </div>

    <!-- Certification Profile: consolidates Type, Path, and Class. Spans the
         top two rows of the right column so its three-line content sits flush
         against the stacked Phase/Status tiles on the left. -->
    <div class="stats-card cert-profile-card">
      <div class="stats-card__header">
        <h2 class="margin-0" id="certification-profile-heading">Certification Profile</h2>
        <Tooltip
          text={t('tooltip-certification-profile')}
          ariaLabel="More info about the Certification Profile"
          position="widescreen:left desktop-lg:left"
          anchorClass="stats-card"
        />
      </div>
      <dl class="cert-profile margin-0">
        <div class="cert-profile__row">
          <dt>Type</dt>
          <dd id="auth-type">
            {#if certType !== 'Unknown'}
              <ProductTag category={displayCertType(certType)} />
            {:else}
              Unknown
            {/if}
          </dd>
        </div>
        <div class="cert-profile__row">
          <dt>Path</dt>
          <dd id="certification-path-value">{certPath}</dd>
        </div>
        <div class="cert-profile__row">
          <dt>Class</dt>
          <dd id="certification-class-number">{displayCertClass(certClass)}</dd>
        </div>
      </dl>
    </div>

    <!-- Certified Since: how long the offering has been FedRAMP Certified.
         Fills the bottom-right cell so the card stays flush. -->
    <div class="stats-card certified-since-card">
      <div class="stats-card__header">
        <h2 class="margin-0">Certified Since</h2>
        <Tooltip
          text={t('tooltip-certified-since')}
          ariaLabel="More info about the certified since date"
          position="widescreen:left desktop-lg:left"
          anchorClass="stats-card"
        />
      </div>
      <p class="margin-0 display-flex flex-align-center font-lg" id="certified-since-content">
        {certifiedSinceLabel}
      </p>
    </div>
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .stats-container {
    padding: 5px;
    background: #f5f5fa;
    border: 1px solid rgba(27, 27, 27, 0.75);
    border-radius: 10px;
    box-sizing: border-box;
    width: 100%;
    max-height: fit-content;
    // No horizontal scroll — content wraps/shrinks to fit instead.
    overflow-x: hidden;
    min-width: 0;
  }

  // 3-row x 2-column grid at every viewport. Left column stacks Phase, Status,
  // Authorizations. Right column: Certification Profile spans the top two rows
  // (its three-line content), with "Certified Since" filling the bottom-right
  // cell — so every cell is occupied and the card stays flush with no empty
  // whitespace. Boxes are intentionally non-uniform in height.
  //
  // This deliberately does NOT collapse to a single column on mobile (issue
  // #1030): the 2-wide x 3-high shape is what removes the awkward horizontal
  // scroll, and `minmax(0, 1fr)` tracks guarantee the columns shrink to the
  // available width rather than being sized by their content.
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, auto);
    gap: 5px;
    width: 100%;
    min-width: 0;
  }

  // Profile card occupies the top two rows of the right column.
  .cert-profile-card {
    grid-column: 2;
    grid-row: 1 / 3;
  }

  // Certified Since fills the bottom-right cell (row 3, column 2).
  .certified-since-card {
    grid-column: 2;
    grid-row: 3;
  }

  .stats-card {
    display: flex;
    flex-direction: column;
    // Comfortable separation between the heading and its value.
    gap: 8px;
    background: #fff;
    padding: 10px;
    border-radius: 10px;
    // Hug content height so tiles stay flush with no trailing whitespace.
    height: auto;
    width: 100%;
    min-width: 0;

    .usa-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      // Keep the status icon from being squeezed when the label wraps.
      flex-shrink: 0;
    }

    // Heading + its tooltip trigger. Previously the Tooltip lived inside the
    // <h2>, which put a <button> in the heading's accessible name. It now sits
    // beside the heading in this flex row, so the heading text is the only
    // thing announced and the tooltip is a separate control.
    &__header {
      display: flex;
      align-items: baseline;
      gap: 4px;
      // At narrow widths the label wraps to a second line rather than pushing
      // the tooltip icon outside the tile.
      flex-wrap: wrap;
    }

    h2 {
      color: #543669;
      // No stray top margin; a small bottom margin gives the value room to
      // breathe beneath the heading (in addition to the flex gap).
      margin: 0 0 2px 0;
      font-size: 1.2rem;
      line-height: 1.2;
      // Two-column layout at mobile widths is narrow; long single words such as
      // "Authorizations" must wrap instead of widening the grid track.
      overflow-wrap: anywhere;
      text-align: left;

      // Each column is roughly half the viewport at small widths (~115px of
      // content box at 320px). Step the label down so "Authorizations" — the
      // longest unbreakable word — fits on one line instead of being split
      // mid-word by the overflow-wrap above.
      @media (max-width: #{uswds.units('mobile-lg')}) {
        font-size: 0.95rem;
      }
    }

    // Values sit flush under their heading with a consistent, compact size.
    p {
      margin: 0;
      line-height: 1.25;

      svg {
        align-items: center;
        text-align: center;
      }
    }
  }

  // Certification Profile: a compact definition list of Type / Path / Class.
  .cert-profile {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: uswds.units(1);
      // In the 2-column mobile grid this tile is roughly half the viewport, so
      // the value wraps onto its own line rather than being crushed against the
      // term. Left-aligned once wrapped (see the `dd` rule below).
      flex-wrap: wrap;
    }

    dt {
      font-weight: uswds.font-weight('bold');
      color: uswds.color('ink');
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    dd {
      margin: 0;
      text-align: right;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    // When the term/value pair wraps, a right-aligned value reads as detached
    // from its term. Align left below mobile-lg where wrapping is likely.
    @media (max-width: #{uswds.units('mobile-lg')}) {
      dd {
        text-align: left;
      }
    }
  }

  // Long status labels (e.g. "FedRAMP Certified (In Remediation)") should wrap
  // within the Status tile instead of widening the card and causing overflow.
  #status-content {
    font-weight: 600;
    align-items: flex-start;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  // The "As of ..." line is secondary; keep it small and snug under the status.
  #status-date {
    font-size: 0.8rem;
    color: uswds.color('gray-50');
  }
</style>
