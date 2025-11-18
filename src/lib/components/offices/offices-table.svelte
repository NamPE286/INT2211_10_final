<script lang="ts">
	import type { Office } from '$lib/types/employee';
	import DataTableBase from '../shared/data-table-base.svelte';
	import { columns } from './offices-columns.js';
	import AddOfficeDialog from './add-office-dialog.svelte';
	import { goto } from '$app/navigation';

	let tableRef: any;

	const filterableColumns = [
		{ value: 'officeCode', label: 'Office Code' },
		{ value: 'city', label: 'City' },
		{ value: 'country', label: 'Country' },
		{ value: 'state', label: 'State' },
		{ value: 'territory', label: 'Territory' }
	];

	async function fetchOffices(params: {
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
			fetch(`/api/offices?${urlParams}`),
			fetch(`/api/offices/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			throw new Error(dataJson.error || countJson.error || 'Failed to fetch offices');
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: Office[]) {
		const officeCodes = items.map((office) => office.officeCode);
		
		const results = await Promise.all(
			officeCodes.map(async (code) => {
				const res = await fetch(`/api/offices/${code}`, {
					method: 'DELETE'
				});
				return { res, code };
			})
		);

		const failedDeletes = results.filter(({ res }) => !res.ok);
		
		if (failedDeletes.length > 0) {
			const errors = await Promise.all(
				failedDeletes.map(async ({ res, code }) => {
					const json = await res.json();
					return `Office ${code}: ${json.error}`;
				})
			);
			throw new Error(errors.join('\n'));
		}
	}

	function handleRowClick(office: Office) {
		goto(`/offices/${office.officeCode}`);
	}

	function handleSuccess() {
		tableRef?.refresh();
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchOffices}
	{filterableColumns}
	defaultFilterColumn="city"
	getRowId={(row) => row.officeCode}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) => `This will permanently delete ${count} office${count > 1 ? 's' : ''}. This action cannot be undone.`}
	selectedItemLabel={(id) => id}
>
	{#snippet addButton()}
		<AddOfficeDialog onSuccess={handleSuccess} />
	{/snippet}
</DataTableBase>
