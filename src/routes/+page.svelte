<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		const res = await (await fetch('/api/customers')).json();

        console.log(res)
	});
</script>

<h1>Welcome to SvelteKit</h1>
