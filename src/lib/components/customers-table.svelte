<script lang="ts">
	import type { Customer } from '$lib/types/customer';

	type Props = {
		data: Customer[];
	};

	let { data = [] }: Props = $props();
</script>