<script lang="ts">
	import ArrowUpDownIcon from 'lucide-svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		onclick?: (event: unknown) => void;
	};

	let { onclick }: Props = $props();
</script>

<Button variant="ghost" size="sm" class="-ml-3 h-8 data-[state=open]:bg-accent" {onclick}>
	<span>Company Name</span>
	<ArrowUpDownIcon class="ml-2 size-4" />
</Button>
