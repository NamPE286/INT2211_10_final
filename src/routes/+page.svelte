<script lang="ts">
	import { onMount } from 'svelte';
	import CustomersTable from '$lib/components/customers-table.svelte';
	import type { Customer } from '$lib/types/customer';

	let customers = $state<Customer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/customers');
			const json = await res.json();
			
			if (res.ok) {
				customers = json.data;
			} else {
				error = json.error || 'Failed to fetch customers';
			}
		} catch (err) {
			error = 'Failed to fetch customers';
			console.error(err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto py-10">
	<h1 class="text-3xl font-bold mb-6">Customers</h1>
	
	{#if loading}
		<p>Loading customers...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else}
		<CustomersTable data={customers} />
	{/if}
</div>

