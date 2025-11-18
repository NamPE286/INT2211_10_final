<script lang="ts">
	import type { Column } from '@tanstack/table-core';

	let { column, label }: { column: Column<any>; label: string } = $props();

	let isSorted = $derived(column.getIsSorted());
</script>

<button class="flex items-center hover:text-foreground font-medium group w-full">
	{label}
	{#if isSorted === 'asc'}
		<span class="ml-1">↑</span>
	{:else if isSorted === 'desc'}
		<span class="ml-1">↓</span>
	{:else}
		<span class="ml-1 opacity-0 group-hover:opacity-50 transition-opacity">↕</span>
	{/if}
</button>
