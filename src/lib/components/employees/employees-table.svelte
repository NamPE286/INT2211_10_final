<script lang="ts">
	import type { Employee } from '$lib/types/employee';
	import DataTableBase from '../shared/data-table-base.svelte';
	import { columns } from './employees-columns.js';
	import AddEmployeeDialog from './add-employee-dialog.svelte';
	import { goto } from '$app/navigation';

	let tableRef: any;

	const filterableColumns = [
		{ value: 'employeeNumber', label: 'No' },
		{ value: 'firstName', label: 'First Name' },
		{ value: 'lastName', label: 'Last Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'jobTitle', label: 'Job Title' },
		{ value: 'city', label: 'Office City' },
		{ value: 'country', label: 'Office Country' }
	];

	async function fetchEmployees(params: {
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
			fetch(`/api/employees?${urlParams}`),
			fetch(`/api/employees/count?${params.searchQuery && params.filterColumn ? `${params.filterColumn}=${params.searchQuery}` : ''}`)
		]);

		const dataJson = await dataRes.json();
		const countJson = await countRes.json();

		if (!dataRes.ok || !countRes.ok) {
			throw new Error(dataJson.error || countJson.error || 'Failed to fetch employees');
		}

		return {
			data: dataJson.data,
			total: countJson.total
		};
	}

	async function handleBulkDelete(items: Employee[], forceDelete = false) {
		const employeeNumbers = items.map((employee) => employee.employeeNumber);
		
		const results = await Promise.all(
			employeeNumbers.map(async (id) => {
				const url = forceDelete ? `/api/employees/${id}?force=true` : `/api/employees/${id}`;
				const res = await fetch(url, {
					method: 'DELETE'
				});
				return { res, id };
			})
		);

		const failedWithReports = await Promise.all(
			results
				.filter(({ res }) => !res.ok)
				.map(async ({ res, id }) => {
					const json = await res.json();
					if (json.hasReports || json.hasCustomers) {
						return {
							id,
							message: json.message,
							reportCount: json.reportCount || 0,
							customerCount: json.customerCount || 0
						};
					}
					return null;
				})
		);

		const employeesWithReports = failedWithReports.filter(Boolean);

		if (employeesWithReports.length > 0 && !forceDelete) {
			const totalReports = employeesWithReports.reduce((sum, emp) => sum + emp!.reportCount, 0);
			const totalCustomers = employeesWithReports.reduce(
				(sum, emp) => sum + emp!.customerCount,
				0
			);
			const messages = employeesWithReports
				.map((emp) => `Employee #${emp!.id}: ${emp!.message}`)
				.join('\n');

			const affectedInfo = [];
			if (totalReports > 0) affectedInfo.push(`${totalReports} employee(s) will lose their manager`);
			if (totalCustomers > 0)
				affectedInfo.push(`${totalCustomers} customer(s) will lose their sales representative`);

			const confirmed = confirm(
				`WARNING: The following employees have dependencies:\n\n${messages}\n\n${affectedInfo.join('\n')}\n\nIf you continue, all related records will have their references set to NULL.\n\nDo you want to proceed with force delete?`
			);

			if (confirmed) {
				await handleBulkDelete(items, true);
				return;
			} else {
				throw new Error('Deletion cancelled by user');
			}
		}

		const allSuccess = results.every(({ res }) => res.ok);
		
		if (!allSuccess && forceDelete) {
			throw new Error('Some employees could not be deleted');
		}
	}

	function handleRowClick(employee: Employee) {
		goto(`/employees/${employee.employeeNumber}`);
	}

	function handleSuccess() {
		tableRef?.refresh();
	}
</script>

<DataTableBase
	bind:this={tableRef}
	{columns}
	fetchData={fetchEmployees}
	{filterableColumns}
	defaultFilterColumn="lastName"
	getRowId={(row) => row.employeeNumber.toString()}
	onRowClick={handleRowClick}
	onBulkDelete={handleBulkDelete}
	deleteConfirmMessage={(count) => `This will permanently delete ${count} employee${count > 1 ? 's' : ''}. This action cannot be undone.`}
	selectedItemLabel={(id) => `#${id}`}
>
	{#snippet addButton()}
		<AddEmployeeDialog onSuccess={handleSuccess} />
	{/snippet}
</DataTableBase>
