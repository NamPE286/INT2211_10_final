<script lang="ts">
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import type { Customer } from '$lib/types/customer';

	type Props = {
		data: Customer[];
	};

	let { data = [] }: Props = $props();

	const columns: ColumnDef<Customer>[] = [
		{
			accessorKey: 'customerNumber',
			header: 'No',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'customerName',
			header: 'Company Name',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'contactFirstName',
			header: 'First Name',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'contactLastName',
			header: 'Last Name',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'phone',
			header: 'Phone',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'city',
			header: 'City',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'country',
			header: 'Country',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'creditLimit',
			header: 'Credit Limit',
			cell: (info) => {
				const value = info.getValue() as string;
				return `$${parseFloat(value).toLocaleString()}`;
			}
		}
	];

	const table = createSvelteTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup}
				<Table.Row>
					{#each headerGroup.headers as header}
						<Table.Head colspan={header.colSpan}>
							{#if !header.isPlaceholder}
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#if table.getRowModel().rows?.length}
				{#each table.getRowModel().rows as row}
					<Table.Row data-state={row.getIsSelected() && 'selected'}>
						{#each row.getVisibleCells() as cell}
							<Table.Cell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">
						No customers found.
					</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
