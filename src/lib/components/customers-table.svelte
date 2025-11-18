<script lang="ts">
	import ChevronDownIcon from 'lucide-svelte/icons/chevron-down';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { FlexRender, createSvelteTable, renderSnippet } from '$lib/components/ui/data-table';
	import type { Customer } from '$lib/types/customer';

	type Props = {
		data: Customer[];
	};

	let { data = [] }: Props = $props();

	const columns: ColumnDef<Customer>[] = [
		{
			accessorKey: 'customerNumber',
			header: 'No',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ value: number }]>((getValue) => {
					const { value } = getValue();
					return {
						render: () => `<div class="font-medium">${value}</div>`
					};
				});
				return renderSnippet(snippet, { value: row.original.customerNumber });
			}
		},
		{
			accessorKey: 'customerName',
			header: 'Company Name',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ value: string }]>((getValue) => {
					const { value } = getValue();
					return {
						render: () => `<div class="font-medium">${value}</div>`
					};
				});
				return renderSnippet(snippet, { value: row.original.customerName });
			}
		},
		{
			accessorKey: 'contactFirstName',
			header: 'First Name',
			cell: ({ row }) => row.original.contactFirstName
		},
		{
			accessorKey: 'contactLastName',
			header: 'Last Name',
			cell: ({ row }) => row.original.contactLastName
		},
		{
			accessorKey: 'phone',
			header: 'Phone',
			cell: ({ row }) => row.original.phone
		},
		{
			accessorKey: 'city',
			header: 'City',
			cell: ({ row }) => row.original.city
		},
		{
			accessorKey: 'country',
			header: 'Country',
			cell: ({ row }) => row.original.country
		},
		{
			accessorKey: 'creditLimit',
			header: () => {
				const headerSnippet = createRawSnippet(() => {
					return {
						render: () => `<div class="text-right">Credit Limit</div>`
					};
				});
				return renderSnippet(headerSnippet);
			},
			cell: ({ row }) => {
				const formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD'
				});

				const snippet = createRawSnippet<[{ amount: string }]>((getAmount) => {
					const { amount } = getAmount();
					const formatted = formatter.format(parseFloat(amount));
					return {
						render: () => `<div class="text-right font-medium">${formatted}</div>`
					};
				});
				return renderSnippet(snippet, { amount: row.original.creditLimit });
			}
		}
	];

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		}
	});
</script>

<div class="w-full">
	<div class="flex items-center py-4">
		<Input
			placeholder="Filter by company name..."
			value={(table.getColumn('customerName')?.getFilterValue() as string) ?? ''}
			oninput={(e) => table.getColumn('customerName')?.setFilterValue(e.currentTarget.value)}
			onchange={(e) => {
				table.getColumn('customerName')?.setFilterValue(e.currentTarget.value);
			}}
			class="max-w-sm"
		/>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="ml-auto">
						Columns <ChevronDownIcon class="ml-2 size-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#each table
					.getAllColumns()
					.filter((col) => col.getCanHide()) as column (column)}
					<DropdownMenu.CheckboxItem
						class="capitalize"
						bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
					>
						{column.id}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head>
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
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">
							No results.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-2 pt-4">
		<div class="text-muted-foreground flex-1 text-sm">
			{table.getFilteredRowModel().rows.length} row(s) total.
		</div>
		<div class="space-x-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</Button>
		</div>
	</div>
</div>
