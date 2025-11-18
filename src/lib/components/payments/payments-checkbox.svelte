<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	let {
		checked = $bindable(),
		indeterminate = false,
		...restProps
	}: {
		checked?: boolean;
		indeterminate?: boolean;
		[key: string]: any;
	} = $props();
</script>

<Checkbox {checked} {indeterminate} {...restProps} />
