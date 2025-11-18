<script lang="ts">
	import type { Customer } from '$lib/types/customer';
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		type VisibilityState,
		type RowSelectionState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { columns } from './customers-columns.js';
	import { onMount } from 'svelte';

	let data = $state<Customer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let pageCount = $state(0);
	let searchQuery = $state('');
	let selectedFilterColumn = $state('customerName');
	let debounceTimer: ReturnType<typeof setTimeout>;

	const filterableColumns = [
		{ value: 'customerNumber', label: 'No' },
		{ value: 'customerName', label: 'Name' },
		{ value: 'contactFirstName', label: 'First Name' },
		{ value: 'contactLastName', label: 'Last Name' },
		{ value: 'phone', label: 'Phone' },
		{ value: 'city', label: 'City' },
		{ value: 'state', label: 'State' },
		{ value: 'country', label: 'Country' }
	];

	const selectedColumnLabel = $derived(
		filterableColumns.find((c) => c.value === selectedFilterColumn)?.label ?? 'Select column'
	);

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let rowSelection = $state<RowSelectionState>({});

	async function fetchCustomers() {
		loading = true;
		error = null;
		try {
			const offset = pagination.pageIndex * pagination.pageSize;
			const params = new URLSearchParams({
				limit: pagination.pageSize.toString(),
				offset: offset.toString()
			});
			if (searchQuery) {
				params.append(selectedFilterColumn, searchQuery);
			}
			if (sorting.length > 0) {
				params.append('sortBy', sorting[0].id);
				params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc');
			}

			const [dataRes, countRes] = await Promise.all([
				fetch(`/api/customers?${params}`),
				fetch(`/api/customers/count?${searchQuery ? `${selectedFilterColumn}=${searchQuery}` : ''}`)
			]);

			const dataJson = await dataRes.json();
			const countJson = await countRes.json();

			if (dataRes.ok && countRes.ok) {
				data = dataJson.data;
				totalCount = countJson.total;
				pageCount = Math.ceil(totalCount / pagination.pageSize);
			} else {
				error = dataJson.error || countJson.error || 'Failed to fetch customers';
			}
		} catch (err) {
			error = 'Failed to fetch customers';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleSearch(value: string) {
		searchQuery = value;
	}

	function applyFilter() {
		pagination.pageIndex = 0;
		fetchCustomers();
	}

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		get pageCount() {
			return pageCount;
		},
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
			fetchCustomers();
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
			fetchCustomers();
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
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			}
		}
	});

	onMount(() => {
		fetchCustomers();
	});
</script>

<div>
	<div class="flex items-center gap-2 py-4">
		<Select.Root
			type="single"
			bind:value={selectedFilterColumn}
			onValueChange={() => {
				if (searchQuery) {
					pagination.pageIndex = 0;
					fetchCustomers();
				}
			}}
		>
			<Select.Trigger class="w-40">
				{selectedColumnLabel}
			</Select.Trigger>
			<Select.Content>
				{#each filterableColumns as column (column.value)}
					<Select.Item value={column.value} label={column.label}>
						{column.label}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Input
			placeholder={`Filter by ${filterableColumns.find((c) => c.value === selectedFilterColumn)?.label.toLowerCase() || 'name'}...`}
			value={searchQuery}
			oninput={(e) => {
				handleSearch(e.currentTarget.value);
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					applyFilter();
				}
			}}
			class="max-w-sm"
		/>
		<Button onclick={applyFilter}>Filter</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="ml-auto">Columns</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
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
	{#if error}
		<p class="text-red-500">{error}</p>
	{:else}
		<div class="border-border rounded-md border">
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									colspan={header.colSpan}
									onclick={() => {
										if (header.column.getCanSort()) {
											header.column.toggleSorting();
										}
									}}
									class={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
								>
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
					{#if loading}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-24 text-center">
								<div class="flex items-center justify-center gap-2">
									<Spinner class="size-5" />
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-state={row.getIsSelected() && 'selected'}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="flex items-center justify-between space-x-2 py-4">
			<div class="text-muted-foreground flex-1 text-sm">
				{table.getFilteredSelectedRowModel().rows.length} of{' '}
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div>
			<div class="flex space-x-2">
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
	{/if}
</div>
