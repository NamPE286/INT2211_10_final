<script lang="ts">
	import CustomersTable from '$lib/components/customers-table.svelte';
</script>

<svelte:head>
	<title>Customers</title>
</svelte:head>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-3xl font-bold">Customers</h1>
	<CustomersTable />
</div>
