<script lang="ts">
	import type { Product } from './products-columns.js';
	import DataTableBase from './data-table-base.svelte';
	import { columns } from './products-columns.js';
	import AddProductDialog from './add-product-dialog.svelte';
	import CreateOrderDialog from './create-order-dialog.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingCart } from 'lucide-svelte';

	let tableRef: any;
	let showOrderDialog = $state(false);
	let selectedProductsForOrder = $state<Map<string, Product>>(new Map());
	let selectedCountForOrder = $state(0);

	const filterableColumns = [
		{ value: 'productCode', label: 'Code' },
		{ value: 'productName', label: 'Product Name' },
		{ value: 'productLine', label: 'Product Line' },
		{ value: 'productVendor', label: 'Vendor' },
		{ value: 'productScale', label: 'Scale' }
	];

	async function fetchProducts(params: {
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
			fetch(`/api/products?${urlParams}`),
			fetch(`/api/products/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			throw new Error(dataJson.error || countJson.error || 'Failed to fetch products');
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: Product[]) {
		const productCodes = items.map((product) => product.productCode);
		
		const results = await Promise.all(
			productCodes.map((id) =>
				fetch(`/api/products/${id}`, {
					method: 'DELETE'
				})
			)
		);

		const allSuccess = results.every((res) => res.ok);
		if (!allSuccess) {
			throw new Error('Some products could not be deleted');
		}
	}

	function handleRowClick(product: Product) {
		goto(`/products/${product.productCode}`);
	}

	function handleSuccess() {
		tableRef?.refresh();
	}

	function openOrderDialog(selectedCount: number, selectedItems: Map<string, Product>) {
		selectedProductsForOrder = selectedItems;
		selectedCountForOrder = selectedCount;
		showOrderDialog = true;
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchProducts}
	{filterableColumns}
	defaultFilterColumn="productName"
	getRowId={(row) => row.productCode}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) => `This will permanently delete ${count} product${count > 1 ? 's' : ''} and all associated order details. This action cannot be undone.`}
	selectedItemLabel={(id) => id}
>
	{#snippet actionButtons({ selectedCount, selectedItems, clearSelection })}
		<Button variant="outline" onclick={() => openOrderDialog(selectedCount, selectedItems)}>
			<ShoppingCart class="mr-2 size-4" />
			Create Order ({selectedCount})
		</Button>
	{/snippet}
	{#snippet addButton()}
		<AddProductDialog onSuccess={handleSuccess} />
	{/snippet}
</DataTableBase>

<CreateOrderDialog
	bind:open={showOrderDialog}
	selectedProducts={selectedProductsForOrder}
	selectedCount={selectedCountForOrder}
/>
