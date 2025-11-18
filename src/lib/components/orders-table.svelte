<script lang="ts">
	import type { OrderWithCustomer } from './orders-columns.js';
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
	import { columns } from './orders-columns.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Trash2, UserPlus } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Customer } from '$lib/types/customer.js';
	import { toast } from 'svelte-sonner';
	import Search from '@lucide/svelte/icons/search';

	let data = $state<OrderWithCustomer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let pageCount = $state(0);
	let searchQuery = $state('');
	let selectedFilterColumn = $state('customerName');
	let customerSearchQuery = $state('');
	let searchedCustomers = $state<Customer[]>([]);
	let loadingCustomers = $state(false);
	let selectedCustomer = $state<Customer | null>(null);

	const filterableColumns = [
		{ value: 'orderNumber', label: 'Order #' },
		{ value: 'status', label: 'Status' },
		{ value: 'customerNumber', label: 'Customer #' },
		{ value: 'customerName', label: 'Customer Name' }
	];

	const selectedColumnLabel = $derived(
		filterableColumns.find((c) => c.value === selectedFilterColumn)?.label ?? 'Select column'
	);

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
	let sorting = $state<SortingState>([{ id: 'orderDate', desc: true }]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let rowSelection = $state<RowSelectionState>({});
	let showDeleteDialog = $state(false);
	let showAssignDialog = $state(false);
	let deleting = $state(false);
	let assigning = $state(false);
	let newCustomerNumber = $state('');

	const pageSizeOptions = [10, 15, 25, 50, 100];

	async function fetchOrders() {
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
				fetch(`/api/orders?${params}`),
				fetch(`/api/orders/count?${searchQuery ? `${selectedFilterColumn}=${searchQuery}` : ''}`)
			]);

			const dataJson = await dataRes.json();
			const countJson = await countRes.json();

			if (dataRes.ok && countRes.ok) {
				data = dataJson.data;
				totalCount = countJson.total;
				pageCount = Math.ceil(totalCount / pagination.pageSize);
			} else {
				const errorMessage = dataJson.error || countJson.error || 'Failed to fetch orders';
				error = errorMessage;
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to fetch orders';
			error = errorMessage;
			toast.error(errorMessage);
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
		fetchOrders();
	}

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getRowId: (row) => row.orderNumber.toString(),
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
			fetchOrders();
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
			fetchOrders();
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

	async function handleBulkDelete() {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const orderNumbers = selectedRows.map((row) => row.original.orderNumber);

		if (orderNumbers.length === 0) return;

		deleting = true;
		try {
			const results = await Promise.all(
				orderNumbers.map((id) =>
					fetch(`/api/orders/${id}`, {
						method: 'DELETE'
					})
				)
			);

			const allSuccess = results.every((res) => res.ok);
			if (allSuccess) {
				rowSelection = {};
				showDeleteDialog = false;
				toast.success(
					`Successfully deleted ${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''}`
				);
				await fetchOrders();
			} else {
				const errorMessage = 'Some orders could not be deleted';
				error = errorMessage;
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to delete orders';
			error = errorMessage;
			toast.error(errorMessage);
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	async function searchCustomers() {
		if (!customerSearchQuery.trim()) {
			searchedCustomers = [];
			return;
		}

		loadingCustomers = true;
		try {
			const params = new URLSearchParams({
				customerName: customerSearchQuery,
				limit: '10'
			});
			const response = await fetch(`/api/customers?${params}`);
			const json = await response.json();

			if (response.ok) {
				searchedCustomers = json.data;
			} else {
				searchedCustomers = [];
			}
		} catch (err) {
			console.error('Failed to search customers:', err);
			searchedCustomers = [];
		} finally {
			loadingCustomers = false;
		}
	}

	function selectCustomer(customer: Customer) {
		selectedCustomer = customer;
		newCustomerNumber = customer.customerNumber.toString();
		customerSearchQuery = customer.customerName;
		searchedCustomers = [];
	}

	async function handleAssignToCustomer() {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const orderNumbers = selectedRows.map((row) => row.original.orderNumber);

		if (orderNumbers.length === 0 || !newCustomerNumber) return;

		assigning = true;
		try {
			const results = await Promise.all(
				orderNumbers.map((orderNumber) =>
					fetch(`/api/orders/${orderNumber}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							customerNumber: parseInt(newCustomerNumber)
						})
					})
				)
			);

			const allSuccess = results.every((res) => res.ok);
			if (allSuccess) {
				rowSelection = {};
				showAssignDialog = false;
				newCustomerNumber = '';
				customerSearchQuery = '';
				selectedCustomer = null;
				searchedCustomers = [];
				toast.success(
					`Successfully assigned ${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''}`
				);
				await fetchOrders();
			} else {
				const errorMessage = 'Some orders could not be updated';
				error = errorMessage;
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to assign orders';
			error = errorMessage;
			toast.error(errorMessage);
			console.error(err);
		} finally {
			assigning = false;
		}
	}

	const selectedIds = $derived(Object.keys(rowSelection));
	const selectedCount = $derived(selectedIds.length);

	onMount(() => {
		fetchOrders();
	});
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
						fetchOrders();
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
				placeholder={`Search by ${filterableColumns.find((c) => c.value === selectedFilterColumn)?.label.toLowerCase() || 'customer name'}...`}
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
				<Button variant="outline" onclick={() => (showAssignDialog = true)}>
					<UserPlus class="mr-2 size-4" />
					Assign ({selectedCount})
				</Button>
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
	</div>
	{#if selectedCount > 0}
		<div class="bg-muted/50 flex flex-wrap items-center gap-2 rounded-md border border-border border-dashed p-2 text-sm">
			<span class="font-medium">Selected ({selectedCount}):</span>
			{#each selectedIds as orderId (orderId)}
				<span class="bg-primary/10 text-primary rounded-md px-2 py-1">
					Order #{orderId}
				</span>
			{/each}
			<Button variant="ghost" size="sm" onclick={() => (rowSelection = {})} class="ml-auto h-7">
				Deselect All
			</Button>
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
							onclick={(e) => {
								const target = e.target as HTMLElement;
								if (target.hasAttribute('data-customer-link')) {
									e.stopPropagation();
									const customerNumber = target.getAttribute('data-customer-link');
									goto(`/customers/${customerNumber}`);
								} else {
									goto(`/orders/${row.original.orderNumber}`);
								}
							}}
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
							fetchOrders();
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

<Dialog.Root bind:open={showAssignDialog}>
	<Dialog.Content class="border-border">
		<Dialog.Header>
			<Dialog.Title>Assign orders to customer</Dialog.Title>
			<Dialog.Description>
				Assign {selectedCount} selected order{selectedCount > 1 ? 's' : ''} to a customer.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="customerSearch">Search Customer by Name</Label>
				<div class="relative">
					<Input
						id="customerSearch"
						type="text"
						bind:value={customerSearchQuery}
						oninput={searchCustomers}
						placeholder="Type customer name to search..."
					/>
					{#if loadingCustomers}
						<div class="absolute top-1/2 right-3 -translate-y-1/2">
							<Spinner class="size-4" />
						</div>
					{/if}
				</div>
				{#if searchedCustomers.length > 0}
					<div class="border-border mt-1 max-h-48 overflow-y-auto rounded-md border">
						{#each searchedCustomers as customer (customer.customerNumber)}
							<div class="hover:bg-accent flex items-center gap-2 px-3 py-2 transition-colors">
								<button
									type="button"
									class="flex-1 text-left text-sm"
									onclick={() => selectCustomer(customer)}
								>
									<div class="font-medium">{customer.customerName}</div>
									<div class="text-muted-foreground text-xs">
										#{customer.customerNumber} • {customer.city}, {customer.country}
									</div>
								</button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => goto(`/customers/${customer.customerNumber}`)}
								>
									View
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{#if selectedCustomer}
				<div class="bg-muted rounded-md p-3">
					<div class="flex items-center justify-between">
						<div>
							<div class="text-sm font-medium">Selected Customer:</div>
							<div class="mt-1 text-sm">{selectedCustomer.customerName}</div>
							<div class="text-muted-foreground text-xs">
								Customer #{selectedCustomer.customerNumber}
							</div>
						</div>
						<Button
							size="sm"
							variant="outline"
							onclick={() =>
								selectedCustomer && goto(`/customers/${selectedCustomer.customerNumber}`)}
						>
							View
						</Button>
					</div>
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="customerNumber">Customer Number</Label>
				<Input
					id="customerNumber"
					type="number"
					bind:value={newCustomerNumber}
					placeholder="Enter customer number or search above"
					readonly={!!selectedCustomer}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={() => {
					showAssignDialog = false;
					customerSearchQuery = '';
					selectedCustomer = null;
					searchedCustomers = [];
				}}
				disabled={assigning}
			>
				Cancel
			</Button>
			<Button onclick={handleAssignToCustomer} disabled={assigning || !newCustomerNumber}>
				{assigning ? 'Assigning...' : 'Assign'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete {selectedCount} order{selectedCount > 1 ? 's' : ''} and all associated
				order details. This action cannot be undone.
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
