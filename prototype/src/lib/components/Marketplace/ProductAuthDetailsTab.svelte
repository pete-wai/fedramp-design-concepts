<!-- lib/components/Marketplace/ProductAuthDetailsTab.svelte -->
<script lang="ts">
  import type { ProductCertPath, ProductCertStatus, ProductAgencyAuthTableRow, ProductId } from '$lib/types/marketplace';
  import DataTable from '$lib/components/Table/DataTable.svelte';
  import type { TimelineStage } from '$lib/types/timeline';

  // Import necessary types and functions from your TanStack Table adapter
  import type { ColumnDef } from '@tanstack/table-core'; // Core ColumnDef type
  import Tooltip from '../Tooltip.svelte';
  import { t } from '$lib/stores/L10nStore';
  import { displayCertStatus } from '$lib/utils/marketplaceDisplay';
  // import { renderComponent } from '$lib/utils/TanStackTableSvelte5Adapter';

  // import StatusBadge from '$lib/components/StatusBadge.svelte';

  // Basic flow: Ready -> In Process -> Authorization
  export let productId: ProductId;
  export let agencyAuthorizations: ProductAgencyAuthTableRow[] = [];
  export let readyDate: Date | null;
  export let inProcessJABDate: Date | null;
  export let inProcessProgramReviewDate: Date | null;
  export let inProcessProgramFinalizationDate: Date | null;
  export let inProcessAgencyDate: Date | null;
  export let certDate: Date | null;
  export let certPath: ProductCertPath = 'Unknown';
  export let partneringAgency: string | null = 'N/A';
  export let partneringAgencyUrl: string | null = null;
  export let independentAssessor: string | null = 'N/A';
  export let annualAssessmentDate: Date | null;

  // const formatOptions: Intl.DateTimeFormatOptions = {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric'
  // };

  // Define the columns for the agency authorizations table using ColumnDef
  const agencyAuthorizationsColumns: ColumnDef<ProductAgencyAuthTableRow>[] = [
    {
      accessorKey: 'agency_name',
      header: 'Agency Name',
      cell: (info) => info.getValue(),
      enableSorting: true,
      sortDescFirst: false,
      sortUndefined: 'last'
    },
    {
      accessorKey: 'sub_agency_name',
      header: 'Sub-Agency Name',
      cell: (info) => info.getValue() || 'N/A',
      enableSorting: true,
      sortDescFirst: false,
      sortUndefined: 'last'
    },
    {
      accessorKey: 'cert_status',
      header: 'Certification Status',
      cell: (info) => {
        // Type hack with unknown being a return type of getValue()
        const status: ProductCertStatus | unknown = info.getValue();
        return displayCertStatus(status as ProductCertStatus);
        // return renderComponent(StatusBadge, { status });
      },
      enableSorting: true,
      sortDescFirst: true,
      sortUndefined: 'last'
    }
  ];

  // Agency authorization rows are computed server-side for just this product
  // (see +page.server.ts) and passed in as a prop. This avoids seeding the full
  // client-side marketplace store on detail pages.
  $: agencyAuthorizationsData = agencyAuthorizations;

  // For tracking stage completion.
  let stageCompletionArray: {
    name: string;
    isPlanned: boolean;
    isInProgress: boolean;
    isComplete: boolean;
    isCancelled: boolean;
  }[] = [];

  // For passing into AuthorizationTimeline
  let stagesArray: TimelineStage[] = [];

  // If a date is not null, that means that stage of the authorization process is finished
  // Exception for readyDates b/c of missing data

  // For old timeline we only care about these dates:
  // 1. FedRAMP Ready date
  // 2. In process review date (agency)
  // 3. (Optional) In process finalization date (program)
  // 4. Certification date (doesn't matter if JAB or program)

  // These dates correspond to these steps
  // 1. Initial Implementation
  // 2. FedRAMP Certified

  /*
  | Stage | Data Mapping |
| ------ |---------------|
| Ready | `ready_date` |
| In Process: Review | `ip_prog_date` or `ip_agency_date` if `ip_prog_date` is "Not Active"
| (Optional) In Process: Finalization | `ip_prog_date2` or `ip_pmo_date` if `ip_prog_date2` is "Not Active"
| Certification | `cert_date` (internal; sourced from the raw producer's `auth_date`/`fedramp_auth`)
*/
  stageCompletionArray.push();
  stagesArray.push({
    name: 'FedRAMP Ready',
    date: readyDate,
    status: readyDate !== null || certDate !== null ? 'finished' : 'ongoing'
  });

  // TODO: progressively add another stage if the previous stage is finished
  if (inProcessAgencyDate !== null) {
    stagesArray.push({
      name: 'FedRAMP Review In Process',
      date: inProcessAgencyDate,
      status: 'finished'
    });
  }

  if (inProcessProgramReviewDate !== null) {
    stagesArray.push({
      name: 'FedRAMP Program Review In Process',
      date: inProcessProgramReviewDate,
      status: 'finished'
    });
  }

  if (inProcessProgramFinalizationDate !== null) {
    stagesArray.push({
      name: 'FedRAMP Review Finalization',
      date: inProcessProgramFinalizationDate,
      status: 'finished'
    });
  }

  if (inProcessJABDate !== null) {
    stagesArray.push({
      name: 'FedRAMP JAB Review',
      date: inProcessJABDate,
      status: 'finished'
    });
  }

  if (certDate !== null) {
    stagesArray.push({
      name: `FedRAMP Certified (${certPath})`,
      date: certDate,
      status: 'finished'
    });
  }

  function formatDateNoYearNoTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<!-- Authorization Details Content -->
<div id="product-auth-details-tab" class="grid-row" role="region" aria-label="Authorization Details Table">
  <div class="tablet:grid-col-12 desktop:grid-col-12 margin-bottom-3">
    <div class="grid-row grid-gap-5">
      <!-- Authorizing Agency (deprecated)-->
      <!-- <div class="mobile-center">
        <h3 class="margin-0" id="partnering-agency-label">
          Authorizing Agency <Tooltip
            text={t('tooltip-authorizing-agency')}
            ariaLabel="More info on Authorizing Agency"
            position="widescreen:left desktop-lg:top"
            anchorClass="mobile-center"
          />
        </h3>
        <p class="margin-top-1 margin-bottom-0 display-flex flex-align-center">
          {#if partneringAgency}
            <span>{partneringAgency}</span>
            {#if partneringAgencyUrl}
              <USAButtonLink href={partneringAgencyUrl} unstyled class="display-inline-flex flex-align-center">
                <svg class="usa-icon" aria-hidden="true" role="img">
                  <use href={asset('/uswds/img/sprite.svg#launch')}></use>
                </svg>
              </USAButtonLink>
            {/if}
          {:else}
            N/A
          {/if}
        </p>
      </div> -->

      <!-- Assessor -->
      <div class="mobile-center">
        <h3 class="margin-0" id="assessor-label">
          Independent Assessor <Tooltip
            text={t('tooltip-assessor')}
            ariaLabel="More info on Independent Assessor"
            position="widescreen:left desktop-lg:top"
            anchorClass="mobile-center"
          />
        </h3>
        <p class="margin-top-1 margin-bottom-0 display-flex flex-align-center">
          {#if independentAssessor}
            <!-- TODO: Replace with MarketplaceLink.svelte -->
            {independentAssessor}
          {:else}
            N/A
          {/if}
        </p>
      </div>

      <!-- Annual assessment date -->
      <div class="mobile-center">
        <h3 class="margin-0" id="partnering-agency-label">
          Annual Assessment Date <Tooltip
            text={t('tooltip-assessment-date')}
            ariaLabel="More info on Annual Assessment Date"
            position="widescreen:left desktop-lg:top"
            anchorClass="mobile-center"
          />
        </h3>
        <p class="margin-top-1 margin-bottom-0 display-flex flex-align-center">
          {#if annualAssessmentDate}
            {formatDateNoYearNoTime(annualAssessmentDate)}
          {:else}
            N/A
          {/if}
        </p>
      </div>
    </div>
  </div>

  <!-- Data Table -->
  <div class="tablet:grid-col-12 desktop:grid-col-12">
    <h3 id="agency-authorizations-table-label">Agency Authorizations Table</h3>
    <p>
      All agencies and bureaus with an active Authorization to Operate (ATO) and/or Authorization to Use (ATU) letter for this Cloud Service Offering:
    </p>
    <div class="grid-col-12 flex-justify-center">
      {#if agencyAuthorizationsData?.length}
        <DataTable
          columns={agencyAuthorizationsColumns}
          data={agencyAuthorizationsData}
          stickyFirstColumn
          caption={`${agencyAuthorizationsData.length} Authorization${agencyAuthorizationsData.length !== 1 ? 's' : ''}`}
        />
      {:else}
        <p class="text-center"><i>No authorizing entities found.</i></p>
      {/if}
    </div>
  </div>
</div>
