<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { toast } from 'svelte-sonner';
	import type { OrderWithCustomer } from './orders-columns';

	interface Props {
		order: OrderWithCustomer;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: () => void;
	}

	let { order, open = $bindable(false), onOpenChange, onSuccess }: Props = $props();

	const statuses = [
		{ value: 'In Process', label: 'In Process' },
		{ value: 'Shipped', label: 'Shipped' },
		{ value: 'Resolved', label: 'Resolved' },
		{ value: 'Cancelled', label: 'Cancelled' },
		{ value: 'On Hold', label: 'On Hold' },
		{ value: 'Disputed', label: 'Disputed' }
	];

	let formData = $state({
		orderDate: new Date(order.orderDate).toISOString().split('T')[0],
		requiredDate: new Date(order.requiredDate).toISOString().split('T')[0],
		shippedDate: order.shippedDate ? new Date(order.shippedDate).toISOString().split('T')[0] : '',
		status: order.status,
		comments: order.comments || ''
	});

	let loading = $state(false);
	let error = $state<string | null>(null);

	function resetForm() {
		formData = {
			orderDate: new Date(order.orderDate).toISOString().split('T')[0],
			requiredDate: new Date(order.requiredDate).toISOString().split('T')[0],
			shippedDate: order.shippedDate ? new Date(order.shippedDate).toISOString().split('T')[0] : '',
			status: order.status,
			comments: order.comments || ''
		};
		error = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/orders/${order.orderNumber}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					orderDate: formData.orderDate,
					requiredDate: formData.requiredDate,
					shippedDate: formData.shippedDate || null,
					status: formData.status,
					comments: formData.comments || null
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Order updated successfully');
				open = false;
				if (onSuccess) onSuccess();
			} else {
				const errorMsg = result.error || 'Failed to update order';
				error = errorMsg;
				toast.error(errorMsg);
			}
		} catch (err) {
			const errorMsg = 'Failed to update order';
			error = errorMsg;
			toast.error(errorMsg);
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (onOpenChange) onOpenChange(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}

	$effect(() => {
		formData = {
			orderDate: new Date(order.orderDate).toISOString().split('T')[0],
			requiredDate: new Date(order.requiredDate).toISOString().split('T')[0],
			shippedDate: order.shippedDate ? new Date(order.shippedDate).toISOString().split('T')[0] : '',
			status: order.status,
			comments: order.comments || ''
		};
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="border-border sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Edit Order #{order.orderNumber}</Dialog.Title>
			<Dialog.Description>Update order information below.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				{#if error}
					<div class="text-sm text-red-500">{error}</div>
				{/if}

				<div class="grid gap-2">
					<Label for="orderDate">Order Date *</Label>
					<Input id="orderDate" type="date" bind:value={formData.orderDate} required />
				</div>

				<div class="grid gap-2">
					<Label for="requiredDate">Required Date *</Label>
					<Input id="requiredDate" type="date" bind:value={formData.requiredDate} required />
				</div>

				<div class="grid gap-2">
					<Label for="shippedDate">Shipped Date</Label>
					<Input id="shippedDate" type="date" bind:value={formData.shippedDate} />
				</div>

				<div class="grid gap-2">
					<Label for="status">Status *</Label>
					<Select.Root type="single" bind:value={formData.status}>
						<Select.Trigger>
							{formData.status}
						</Select.Trigger>
						<Select.Content class="border-border">
							{#each statuses as status}
								<Select.Item value={status.value} label={status.label}>
									{status.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label for="comments">Comments</Label>
					<Textarea
						id="comments"
						bind:value={formData.comments}
						placeholder="Add any notes or comments..."
						rows={3}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={loading}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Updating...' : 'Update Order'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
