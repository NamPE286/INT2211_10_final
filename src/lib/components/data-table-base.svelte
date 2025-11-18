<script lang="ts">
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		type VisibilityState,
		type RowSelectionState,
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { onMount } from 'svelte';
	import { Trash2 } from 'lucide-svelte';
	import Search from '@lucide/svelte/icons/search';
	import type { Snippet } from 'svelte';

	type FilterColumn = {
		value: string;
		label: string;
	};

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		fetchData: (params: {
			limit: number;
			offset: number;
			searchQuery?: string;
			filterColumn?: string;
			sortBy?: string;
			sortOrder?: 'asc' | 'desc';
		}) => Promise<{ data: TData[]; total: number }>;
		filterableColumns: FilterColumn[];
		defaultFilterColumn: string;
		defaultSortColumn?: string;
		defaultSortDesc?: boolean;
		getRowId: (row: TData) => string;
		onRowClick?: (row: TData) => void;
		onBulkDelete?: (items: TData[]) => Promise<void>;
		deleteConfirmMessage?: (count: number) => string;
		selectedItemLabel?: (id: string) => string;
		actionButtons?: Snippet<[{ selectedCount: number; selectedItems: Map<string, TData>; clearSelection: () => void }]>;
		addButton?: Snippet;
		customCellClick?: (columnId: string, e: MouseEvent) => void;
	}

	type TData = $$Generic;
	type TValue = $$Generic;

	let {
		columns,
		fetchData,
		filterableColumns,
		defaultFilterColumn,
		defaultSortColumn,
		defaultSortDesc = false,
		getRowId,
		onRowClick,
		onBulkDelete,
		deleteConfirmMessage = (count: number) => `This will permanently delete ${count} item${count > 1 ? 's' : ''}. This action cannot be undone.`,
		selectedItemLabel = (id: string) => `#${id}`,
		actionButtons,
		addButton,
		customCellClick
	}: DataTableProps<TData, TValue> = $props();

	let data = $state<TData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let pageCount = $state(0);
	let searchQuery = $state('');
	let selectedFilterColumn = $state(defaultFilterColumn);

	const pageSizeOptions = [10, 15, 25, 50, 100];

	const selectedColumnLabel = $derived(
		filterableColumns.find((c) => c.value === selectedFilterColumn)?.label ?? 'Select column'
	);

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
	let sorting = $state<SortingState>(
		defaultSortColumn ? [{ id: defaultSortColumn, desc: defaultSortDesc }] : []
	);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let rowSelection = $state<RowSelectionState>({});
	let selectedItems = $state<Map<string, TData>>(new Map());
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	async function fetch() {
		loading = true;
		error = null;
		try {
			const offset = pagination.pageIndex * pagination.pageSize;
			const params: Parameters<typeof fetchData>[0] = {
				limit: pagination.pageSize,
				offset
			};

			if (searchQuery) {
				params.searchQuery = searchQuery;
				params.filterColumn = selectedFilterColumn;
			}

			if (sorting.length > 0) {
				params.sortBy = sorting[0].id;
				params.sortOrder = sorting[0].desc ? 'desc' : 'asc';
			}

			const result = await fetchData(params);
			data = result.data;
			totalCount = result.total;
			pageCount = Math.ceil(totalCount / pagination.pageSize);
		} catch (err) {
			error = 'Failed to fetch data';
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
		fetch();
	}

	function clearSelection() {
		rowSelection = {};
		selectedItems = new Map();
	}

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getRowId,
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
			fetch();
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
			fetch();
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
			const newSelectedItems = new Map(selectedItems);
			for (const key of selectedItems.keys()) {
				if (!rowSelection[key]) {
					newSelectedItems.delete(key);
				}
			}
			for (const row of table.getRowModel().rows) {
				if (rowSelection[row.id]) {
					newSelectedItems.set(row.id, row.original);
				}
			}
			selectedItems = newSelectedItems;
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

	async function handleBulkDelete() {
		const items = Array.from(selectedItems.values());
		if (items.length === 0 || !onBulkDelete) return;

		deleting = true;
		try {
			await onBulkDelete(items);
			clearSelection();
			showDeleteDialog = false;
			await fetch();
		} catch (err) {
			error = 'Failed to delete items';
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	const selectedIds = $derived(Object.keys(rowSelection));
	const selectedCount = $derived(selectedIds.length);

	onMount(() => {
		fetch();
	});

	export function refresh() {
		fetch();
	}
</script>

<div>
	<div class="flex flex-col gap-2 py-4">
		<div class="flex items-center gap-2">
			<Select.Root
				type="single"
				bind:value={selectedFilterColumn}
				onValueChange={() => {
					if (searchQuery) {
						pagination.pageIndex = 0;
						fetch();
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
				placeholder={`Search by ${filterableColumns.find((c) => c.value === selectedFilterColumn)?.label.toLowerCase()}...`}
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
			{#if actionButtons}
				{@render actionButtons({ selectedCount, selectedItems, clearSelection })}
			{/if}
			{#if selectedCount > 0 && onBulkDelete}
				<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
					<Trash2 class="mr-2 size-4" />
					Delete ({selectedCount})
				</Button>
				<Button variant="outline" onclick={clearSelection}>
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
			{#if addButton}
				{@render addButton()}
			{/if}
		</div>
		{#if selectedCount > 0}
			<div class="bg-muted/50 flex flex-wrap items-center gap-2 rounded-md border border-border border-dashed p-2 text-sm">
				<span class="font-medium">Selected ({selectedCount}):</span>
				{#each selectedIds as id (id)}
					<span class="bg-primary/10 text-primary rounded-md px-2 py-1">
						{selectedItemLabel(id)}
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
							class={onRowClick ? 'cursor-pointer' : ''}
							onclick={() => onRowClick?.(row.original)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									onclick={(e) => {
										if (cell.column.id === 'select') {
											e.stopPropagation();
										}
										customCellClick?.(cell.column.id, e);
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
							fetch();
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

{#if onBulkDelete}
	<AlertDialog.Root bind:open={showDeleteDialog}>
		<AlertDialog.Content class="border-border">
			<AlertDialog.Header>
				<AlertDialog.Title>Are you sure?</AlertDialog.Title>
				<AlertDialog.Description>
					{deleteConfirmMessage(selectedCount)}
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
{/if}
