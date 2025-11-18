<script lang="ts">
	import type { Customer } from '$lib/types/customer';
	import DataTableBase from './data-table-base.svelte';
	import { columns } from './customers-columns.js';
	import AddCustomerDialog from './add-customer-dialog.svelte';
	import { goto } from '$app/navigation';

	let tableRef: any;

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

	async function fetchCustomers(params: {
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
			fetch(`/api/customers?${urlParams}`),
			fetch(`/api/customers/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			throw new Error(dataJson.error || countJson.error || 'Failed to fetch customers');
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: Customer[]) {
		const customerNumbers = items.map((customer) => customer.customerNumber);
		
		const results = await Promise.all(
			customerNumbers.map((id) =>
				fetch(`/api/customers/${id}`, {
					method: 'DELETE'
				})
			)
		);

		const allSuccess = results.every((res) => res.ok);
		if (!allSuccess) {
			throw new Error('Some customers could not be deleted');
		}
	}

	function handleRowClick(customer: Customer) {
		goto(`/customers/${customer.customerNumber}`);
	}

	function handleSuccess() {
		tableRef?.refresh();
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchCustomers}
	{filterableColumns}
	defaultFilterColumn="customerName"
	getRowId={(row) => row.customerNumber.toString()}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) => `This will permanently delete ${count} customer${count > 1 ? 's' : ''}. This action cannot be undone.`}
	selectedItemLabel={(id) => `#${id}`}
>
	{#snippet addButton()}
		<AddCustomerDialog onSuccess={handleSuccess} />
	{/snippet}
</DataTableBase>
