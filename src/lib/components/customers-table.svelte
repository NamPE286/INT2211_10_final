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
	import AddCustomerDialog from './add-customer-dialog.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Trash2 } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Search from '@lucide/svelte/icons/search';

	let data = $state<Customer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let pageCount = $state(0);
	let searchQuery = $state('');
	let selectedFilterColumn = $state('customerName');
	let debounceTimer: ReturnType<typeof setTimeout>;

	const pageSizeOptions = [10, 15, 25, 50, 100];

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
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

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
		getRowId: (row) => row.customerNumber.toString(),
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

	async function handleBulkDelete() {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const customerNumbers = selectedRows.map((row) => row.original.customerNumber);

		if (customerNumbers.length === 0) return;

		deleting = true;
		try {
			const results = await Promise.all(
				customerNumbers.map((id) =>
					fetch(`/api/customers/${id}`, {
						method: 'DELETE'
					})
				)
			);

			const allSuccess = results.every((res) => res.ok);
			if (allSuccess) {
				rowSelection = {};
				showDeleteDialog = false;
				await fetchCustomers();
			} else {
				error = 'Some customers could not be deleted';
			}
		} catch (err) {
			error = 'Failed to delete customers';
			console.error(err);
		} finally {
		deleting = false;
	}
}

const selectedIds = $derived(Object.keys(rowSelection));
const selectedCount = $derived(selectedIds.length);
</script><div>
	<div class="flex flex-col gap-2 py-4">
		<div class="flex items-center gap-2">
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
				<Select.Content class="border-border">
					{#each filterableColumns as column (column.value)}
						<Select.Item value={column.value} label={column.label}>
							{column.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Input
				placeholder={`Search by ${filterableColumns.find((c) => c.value === selectedFilterColumn)?.label.toLowerCase() || 'name'}...`}
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
			<Button onclick={applyFilter}><Search /></Button>
			{#if selectedCount > 0}
				<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
					<Trash2 class="mr-2 size-4" />
					Delete ({selectedCount})
				</Button>
				<Button variant="outline" onclick={() => (rowSelection = {})}>
					Clear Selection
				</Button>
			{/if}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="ml-auto">Columns</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="border-border">
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
			<AddCustomerDialog onSuccess={fetchCustomers} />
		</div>
		{#if selectedCount > 0}
			<div class="bg-muted/50 flex flex-wrap items-center gap-2 rounded-md border border-border border-dashed p-2 text-sm">
				<span class="font-medium">Selected ({selectedCount}):</span>
				{#each selectedIds as customerId (customerId)}
					<span class="bg-primary/10 text-primary rounded-md px-2 py-1">
						#{customerId}
					</span>
				{/each}
			</div>
		{/if}
	</div>
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
						<Table.Row
							data-state={row.getIsSelected() && 'selected'}
							class="cursor-pointer"
							onclick={() => goto(`/customers/${row.original.customerNumber}`)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									onclick={(e) => {
										if (cell.column.id === 'select') {
											e.stopPropagation();
										}
									}}
								>
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
		<div class="flex items-center space-x-2">
			<div class="flex items-center space-x-2">
				<span class="text-muted-foreground text-sm">Rows per page:</span>
				<Select.Root
					type="single"
					value={pagination.pageSize.toString()}
					onValueChange={(value) => {
						if (value) {
							pagination = { ...pagination, pageSize: parseInt(value), pageIndex: 0 };
							fetchCustomers();
						}
					}}
				>
					<Select.Trigger class="w-20">
						{pagination.pageSize}
					</Select.Trigger>
					<Select.Content class="border-border">
						{#each pageSizeOptions as size (size)}
							<Select.Item value={size.toString()} label={size.toString()}>
								{size}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="text-muted-foreground text-sm">
				Page {pagination.pageIndex + 1} of {pageCount || 1}
			</div>
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

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete {selectedCount} customer{selectedCount > 1 ? 's' : ''}. This
				action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleBulkDelete} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
