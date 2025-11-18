<script lang="ts">
	import OrdersTable from '$lib/components/orders/orders-table.svelte';
</script>

<svelte:head>
	<title>Orders</title>
</svelte:head>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-3xl font-bold">Orders</h1>
	<OrdersTable />
</div>
