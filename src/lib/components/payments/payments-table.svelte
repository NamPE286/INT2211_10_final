<script lang="ts">
	import type { Payment } from '$lib/types/customer';
	import DataTableBase from '../shared/data-table-base.svelte';
	import { columns } from './payments-columns.js';
	import AddPaymentDialog from './add-payment-dialog.svelte';
	import { goto } from '$app/navigation';

	let tableRef: any;

	const filterableColumns = [
		{ value: 'checkNumber', label: 'Check Number' },
		{ value: 'customerNumber', label: 'Customer No' },
		{ value: 'customerName', label: 'Customer Name' }
	];

	async function fetchPayments(params: {
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
			fetch(`/api/payments?${urlParams}`),
			fetch(
				`/api/payments/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`
			)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			throw new Error(dataJson.error || countJson.error || 'Failed to fetch payments');
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: Payment[]) {
		const results = await Promise.all(
			items.map(async (payment) => {
				const res = await fetch(
					`/api/payments/${payment.customerNumber}/${payment.checkNumber}`,
					{
						method: 'DELETE'
					}
				);
				return { res, payment };
			})
		);

		const failedDeletes = results.filter(({ res }) => !res.ok);

		if (failedDeletes.length > 0) {
			const errors = await Promise.all(
				failedDeletes.map(async ({ res, payment }) => {
					const json = await res.json();
					return `Payment ${payment.checkNumber}: ${json.error}`;
				})
			);
			throw new Error(errors.join('\n'));
		}
	}

	function handleRowClick(payment: Payment) {
		goto(`/payments/${payment.customerNumber}/${payment.checkNumber}`);
	}

	function handleSuccess() {
		tableRef?.refresh();
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchPayments}
	{filterableColumns}
	defaultFilterColumn="checkNumber"
	getRowId={(row) => `${row.customerNumber}-${row.checkNumber}`}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) =>
		`This will permanently delete ${count} payment${count > 1 ? 's' : ''}. This action cannot be undone.`}
	selectedItemLabel={(id) => id}
>
	{#snippet addButton()}
		<AddPaymentDialog onSuccess={handleSuccess} />
	{/snippet}
</DataTableBase>
