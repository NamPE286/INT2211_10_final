<script lang="ts">
	import PaymentsTable from '$lib/components/payments/payments-table.svelte';
</script>

<svelte:head>
	<title>Payments</title>
</svelte:head>

<div class="container mx-auto py-10">
	<h1 class="mb-8 text-3xl font-bold">Payments</h1>
	<PaymentsTable />
</div>
