<!-- lib/components/Marketplace/ProductDepProductsTab.svelte -->
<script lang="ts">
  import type { ProductLeveragedSystemsTableRow } from '$lib/types/marketplace';
  import type { ColumnDef } from '@tanstack/table-core';
  import DataTable from '../Table/DataTable.svelte';

  const agencyAuthorizationsColumns: ColumnDef<ProductLeveragedSystemsTableRow>[] = [
    {
      accessorKey: 'csp',
      header: 'Cloud Service Provider',
      cell: (info: any) => info.getValue(),
      enableSorting: true,
      sortDescFirst: false,
      sortUndefined: 'last'
    },
    {
      accessorKey: 'cso',
      header: 'Cloud Service Offering',
      cell: (info: any) => info.getValue(),
      enableSorting: true,
      sortDescFirst: false,
      sortUndefined: 'last'
    },
    {
      accessorKey: 'id',
      header: 'Package ID',
      cell: (info: any) => info.getValue(),
      enableSorting: false,
      sortDescFirst: false,
      sortUndefined: 'last'
    }
  ];

  let { dependentProducts } = $props();
</script>

<div class="grid-row" role="region" aria-label="Dependent Products Table">
  <div class="tablet:grid-col-12 desktop:grid-col-12">
    <h3 class="margin-top-0">Dependent Products Table</h3>
    <p>Other FedRAMP Certified Cloud Service Offerings that depend on this Cloud Service Offering (i.e. dependents):</p>
    <div class="grid-col-12 flex-justify-center">
      {#if dependentProducts?.length}
        <DataTable
          columns={agencyAuthorizationsColumns}
          data={dependentProducts}
          stickyFirstColumn={true}
          caption={`${dependentProducts.length} Dependent Product${dependentProducts.length !== 1 ? 's' : ''}`}
        />
      {:else}
        <p class="text-center"><i>No dependent products found.</i></p>
      {/if}
    </div>
  </div>
</div>
