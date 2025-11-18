<script lang="ts">
	import ProductsTable from '$lib/components/products-table.svelte';
</script>

<svelte:head>
	<title>Products</title>
</svelte:head>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-3xl font-bold">Products</h1>
	<ProductsTable />
</div>
