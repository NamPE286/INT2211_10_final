<script lang="ts">
	import type { OrderWithCustomer } from './orders-columns.js';
	import DataTableBase from '../shared/data-table-base.svelte';
	import { columns } from './orders-columns.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import AssignOrdersDialog from './assign-orders-dialog.svelte';
	import { toast } from 'svelte-sonner';
	import { UserPlus } from 'lucide-svelte';

	let tableRef: any;
	let showAssignDialog = $state(false);
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
			fetch(
				`/api/orders/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`
			)
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

	function openAssignDialog(selectedCount: number, selectedItems: Map<string, OrderWithCustomer>) {
		selectedOrdersForAssign = selectedItems;
		selectedCountForAssign = selectedCount;
		showAssignDialog = true;
	}

	function handleAssignSuccess() {
		tableRef?.refresh();
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
	deleteConfirmMessage={(count) =>
		`This will permanently delete ${count} order${count > 1 ? 's' : ''} and all associated order details. This action cannot be undone.`}
	selectedItemLabel={(id) => `Order #${id}`}
	customCellClick={handleCellClick}
>
	{#snippet actionButtons({ selectedCount, selectedItems, clearSelection })}
		{#if selectedCount > 0}
			<Button variant="outline" onclick={() => openAssignDialog(selectedCount, selectedItems)}>
				<UserPlus class="mr-2 size-4" />
				Assign ({selectedCount})
			</Button>
		{/if}
	{/snippet}
</DataTableBase>

<AssignOrdersDialog
	bind:open={showAssignDialog}
	selectedOrders={selectedOrdersForAssign}
	selectedCount={selectedCountForAssign}
	onSuccess={handleAssignSuccess}
/>
