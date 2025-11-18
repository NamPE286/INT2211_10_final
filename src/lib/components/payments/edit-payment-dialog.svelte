<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Payment } from '$lib/types/customer';
	import { toast } from 'svelte-sonner';

	let {
		payment,
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		payment: Payment;
		open: boolean;
		onSuccess?: () => void;
	} = $props();

	let submitting = $state(false);

	function formatDateForInput(date: string | Date): string {
		if (typeof date === 'string') {
			return date.split('T')[0];
		}
		return new Date(date).toISOString().split('T')[0];
	}

	let formData = $state({
		paymentDate: formatDateForInput(payment.paymentDate),
		amount: payment.amount
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;

		try {
			const response = await fetch(
				`/api/payments/${payment.customerNumber}/${payment.checkNumber}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						paymentDate: formData.paymentDate,
						amount: parseFloat(formData.amount.toString())
					})
				}
			);

			if (response.ok) {
				toast.success('Payment updated successfully');
				open = false;
				onSuccess();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update payment');
			}
		} catch (err) {
			toast.error('Failed to update payment');
			console.error(err);
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (open) {
			formData = {
				paymentDate: formatDateForInput(payment.paymentDate),
				amount: payment.amount
			};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto border-border sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Payment</Dialog.Title>
			<Dialog.Description>Update the payment details.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label>Customer Number</Label>
				<Input value={payment.customerNumber} disabled />
			</div>

			<div class="space-y-2">
				<Label>Check Number</Label>
				<Input value={payment.checkNumber} disabled />
			</div>

			<div class="space-y-2">
				<Label for="paymentDate">Payment Date *</Label>
				<Input
					id="paymentDate"
					type="date"
					bind:value={formData.paymentDate}
					required
					disabled={submitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="amount">Amount *</Label>
				<Input
					id="amount"
					type="number"
					step="0.01"
					min="0"
					bind:value={formData.amount}
					required
					disabled={submitting}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={submitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Updating...' : 'Update Payment'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
