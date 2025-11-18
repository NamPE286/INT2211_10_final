<script lang="ts">
	import EmployeesTable from '$lib/components/employees/employees-table.svelte';
</script>

<svelte:head>
	<title>Employees</title>
</svelte:head>

<div class="container mx-auto py-10">
	<h1 class="mb-8 text-3xl font-bold">Employees</h1>
	<EmployeesTable />
</div>
