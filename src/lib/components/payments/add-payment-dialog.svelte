<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import type { Customer } from '$lib/types/customer';

	let { onSuccess = () => {} }: { onSuccess?: () => void } = $props();

	let open = $state(false);
	let submitting = $state(false);
	let customers = $state<Customer[]>([]);

	let formData = $state({
		customerNumber: '',
		checkNumber: '',
		paymentDate: '',
		amount: ''
	});

	onMount(async () => {
		try {
			const response = await fetch('/api/customers?limit=1000');
			const data = await response.json();
			customers = data.data;
		} catch (err) {
			console.error('Failed to load customers:', err);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;

		try {
			const response = await fetch('/api/payments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					customerNumber: parseInt(formData.customerNumber),
					amount: parseFloat(formData.amount)
				})
			});

			if (response.ok) {
				toast.success('Payment created successfully');
				open = false;
				resetForm();
				onSuccess();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to create payment');
			}
		} catch (err) {
			toast.error('Failed to create payment');
			console.error(err);
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		formData = {
			customerNumber: '',
			checkNumber: '',
			paymentDate: '',
			amount: ''
		};
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button size="sm">
			<Plus class="mr-2 size-4" />
			Add Payment
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto border-border sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Add New Payment</Dialog.Title>
			<Dialog.Description>Enter the payment details.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="customerNumber">Customer *</Label>
				<Select.Root type="single" bind:value={formData.customerNumber}>
					<Select.Trigger>
						{customers.find((c) => c.customerNumber.toString() === formData.customerNumber)
							?.customerName || 'Select customer'}
					</Select.Trigger>
					<Select.Content class="border-border">
						{#each customers as customer}
							<Select.Item
								value={customer.customerNumber.toString()}
								label="{customer.customerName} (#{customer.customerNumber})"
							>
								{customer.customerName} (#{customer.customerNumber})
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="checkNumber">Check Number *</Label>
				<Input
					id="checkNumber"
					bind:value={formData.checkNumber}
					required
					maxlength={50}
					disabled={submitting}
				/>
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
					{submitting ? 'Creating...' : 'Create Payment'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
