<script lang="ts">
	import type { OrderWithCustomer } from './orders-columns.js';
	import DataTableBase from './data-table-base.svelte';
	import { columns } from './orders-columns.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { Customer } from '$lib/types/customer.js';
	import { toast } from 'svelte-sonner';
	import { UserPlus } from 'lucide-svelte';

	let tableRef: any;
	let showAssignDialog = $state(false);
	let assigning = $state(false);
	let newCustomerNumber = $state('');
	let customerSearchQuery = $state('');
	let searchedCustomers = $state<Customer[]>([]);
	let loadingCustomers = $state(false);
	let selectedCustomer = $state<Customer | null>(null);
	let selectedOrdersForAssign = $state<Map<string, OrderWithCustomer>>(new Map());
	let selectedCountForAssign = $state(0);

	const filterableColumns = [
		{ value: 'orderNumber', label: 'Order #' },
		{ value: 'status', label: 'Status' },
		{ value: 'customerNumber', label: 'Customer #' },
		{ value: 'customerName', label: 'Customer Name' }
	];

	async function fetchOrders(params: {
		limit: number;
		offset: number;
		searchQuery?: string;
		filterColumn?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	}) {
		const urlParams = new URLSearchParams({
			limit: params.limit.toString(),
			offset: params.offset.toString()
		});
		
		if (params.searchQuery && params.filterColumn) {
			urlParams.append(params.filterColumn, params.searchQuery);
		}
		
		if (params.sortBy && params.sortOrder) {
			urlParams.append('sortBy', params.sortBy);
			urlParams.append('sortOrder', params.sortOrder);
		}

		const [dataRes, countRes] = await Promise.all([
			fetch(`/api/orders?${urlParams}`),
			fetch(`/api/orders/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			const errorMessage = dataJson.error || countJson.error || 'Failed to fetch orders';
			toast.error(errorMessage);
			throw new Error(errorMessage);
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: OrderWithCustomer[]) {
		const orderNumbers = items.map((order) => order.orderNumber);
		
		const results = await Promise.all(
			orderNumbers.map((id) =>
				fetch(`/api/orders/${id}`, {
					method: 'DELETE'
				})
			)
		);

		const allSuccess = results.every((res) => res.ok);
		if (allSuccess) {
			toast.success(
				`Successfully deleted ${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''}`
			);
		} else {
			toast.error('Some orders could not be deleted');
			throw new Error('Some orders could not be deleted');
		}
	}

	function handleRowClick(order: OrderWithCustomer) {
		goto(`/orders/${order.orderNumber}`);
	}

	function handleCellClick(columnId: string, e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.hasAttribute('data-customer-link')) {
			e.stopPropagation();
			const customerNumber = target.getAttribute('data-customer-link');
			goto(`/customers/${customerNumber}`);
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
		const orderNumbers = Array.from(selectedOrdersForAssign.values()).map((order) => order.orderNumber);

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
				showAssignDialog = false;
				newCustomerNumber = '';
				customerSearchQuery = '';
				selectedCustomer = null;
				searchedCustomers = [];
				toast.success(
					`Successfully assigned ${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''}`
				);
				tableRef?.refresh();
			} else {
				const errorMessage = 'Some orders could not be updated';
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to assign orders';
			toast.error(errorMessage);
			console.error(err);
		} finally {
			assigning = false;
		}
	}

	function openAssignDialog(selectedCount: number, selectedItems: Map<string, OrderWithCustomer>) {
		selectedOrdersForAssign = selectedItems;
		selectedCountForAssign = selectedCount;
		showAssignDialog = true;
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchOrders}
	{filterableColumns}
	defaultFilterColumn="customerName"
	defaultSortColumn="orderDate"
	defaultSortDesc={true}
	getRowId={(row) => row.orderNumber.toString()}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) => `This will permanently delete ${count} order${count > 1 ? 's' : ''} and all associated order details. This action cannot be undone.`}
	selectedItemLabel={(id) => `Order #${id}`}
	customCellClick={handleCellClick}
>
	{#snippet actionButtons({ selectedCount, selectedItems, clearSelection })}
		<Button variant="outline" onclick={() => openAssignDialog(selectedCount, selectedItems)}>
			<UserPlus class="mr-2 size-4" />
			Assign ({selectedCount})
		</Button>
	{/snippet}
</DataTableBase>

<Dialog.Root bind:open={showAssignDialog}>
	<Dialog.Content class="border-border">
		<Dialog.Header>
			<Dialog.Title>Assign orders to customer</Dialog.Title>
			<Dialog.Description>
				Assign {selectedCountForAssign} selected order{selectedCountForAssign > 1 ? 's' : ''} to a customer.
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
							onclick={() => {
								if (selectedCustomer) {
									goto(`/customers/${selectedCustomer.customerNumber}`);
								}
							}}
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
