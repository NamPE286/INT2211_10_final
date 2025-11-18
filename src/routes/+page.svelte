<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { themeStore } from '$lib/stores/theme.svelte';

	onMount(async () => {
		const res = await (await fetch('/api/customers')).json();

		console.log(res);
	});
</script>

