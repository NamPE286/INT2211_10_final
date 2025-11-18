<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';

	type Props = {
		checked?: boolean;
		indeterminate?: boolean;
		onCheckedChange?: (value: boolean) => void;
		'aria-label'?: string;
	};

	let { checked = false, indeterminate = false, onCheckedChange, ...restProps }: Props = $props();
</script>

<Checkbox {checked} {indeterminate} onCheckedChange={onCheckedChange} {...restProps} />
