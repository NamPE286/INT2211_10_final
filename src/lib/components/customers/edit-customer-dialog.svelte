<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import type { Customer } from '$lib/types/customer';

	interface Props {
		customer: Customer;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: () => void;
	}

	let { customer, open = $bindable(false), onOpenChange, onSuccess }: Props = $props();

	let formData = $state({
		customerName: customer.customerName,
		contactFirstName: customer.contactFirstName,
		contactLastName: customer.contactLastName,
		phone: customer.phone,
		addressLine1: customer.addressLine1,
		addressLine2: customer.addressLine2 || '',
		city: customer.city,
		state: customer.state || '',
		postalCode: customer.postalCode || '',
		country: customer.country,
		salesRepEmployeeNumber: customer.salesRepEmployeeNumber?.toString() || '',
		creditLimit: customer.creditLimit
	});

	let loading = $state(false);
	let error = $state<string | null>(null);

	function resetForm() {
		formData = {
			customerName: customer.customerName,
			contactFirstName: customer.contactFirstName,
			contactLastName: customer.contactLastName,
			phone: customer.phone,
			addressLine1: customer.addressLine1,
			addressLine2: customer.addressLine2 || '',
			city: customer.city,
			state: customer.state || '',
			postalCode: customer.postalCode || '',
			country: customer.country,
			salesRepEmployeeNumber: customer.salesRepEmployeeNumber?.toString() || '',
			creditLimit: customer.creditLimit
		};
		error = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/customers/${customer.customerNumber}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					salesRepEmployeeNumber: parseInt(formData.salesRepEmployeeNumber) || null,
					creditLimit: formData.creditLimit || '0.00'
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Customer updated successfully');
				open = false;
				if (onSuccess) onSuccess();
			} else {
				const errorMsg = result.error || 'Failed to update customer';
				error = errorMsg;
				toast.error(errorMsg);
			}
		} catch (err) {
			const errorMsg = 'Failed to update customer';
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
			customerName: customer.customerName,
			contactFirstName: customer.contactFirstName,
			contactLastName: customer.contactLastName,
			phone: customer.phone,
			addressLine1: customer.addressLine1,
			addressLine2: customer.addressLine2 || '',
			city: customer.city,
			state: customer.state || '',
			postalCode: customer.postalCode || '',
			country: customer.country,
			salesRepEmployeeNumber: customer.salesRepEmployeeNumber?.toString() || '',
			creditLimit: customer.creditLimit
		};
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="border-border max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Customer</Dialog.Title>
			<Dialog.Description>Update customer information below.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				{#if error}
					<div class="text-sm text-red-500">{error}</div>
				{/if}

				<div class="grid gap-2">
					<Label for="customerName">Customer Name *</Label>
					<Input
						id="customerName"
						bind:value={formData.customerName}
						required
						placeholder="ABC Company"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="contactFirstName">First Name *</Label>
						<Input
							id="contactFirstName"
							bind:value={formData.contactFirstName}
							required
							placeholder="John"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="contactLastName">Last Name *</Label>
						<Input
							id="contactLastName"
							bind:value={formData.contactLastName}
							required
							placeholder="Doe"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="phone">Phone *</Label>
					<Input id="phone" bind:value={formData.phone} required placeholder="+1-234-567-8900" />
				</div>

				<div class="grid gap-2">
					<Label for="addressLine1">Address Line 1 *</Label>
					<Input
						id="addressLine1"
						bind:value={formData.addressLine1}
						required
						placeholder="123 Main St"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="addressLine2">Address Line 2</Label>
					<Input id="addressLine2" bind:value={formData.addressLine2} placeholder="Suite 100" />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="city">City *</Label>
						<Input id="city" bind:value={formData.city} required placeholder="New York" />
					</div>
					<div class="grid gap-2">
						<Label for="state">State</Label>
						<Input id="state" bind:value={formData.state} placeholder="NY" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="postalCode">Postal Code</Label>
						<Input id="postalCode" bind:value={formData.postalCode} placeholder="10001" />
					</div>
					<div class="grid gap-2">
						<Label for="country">Country *</Label>
						<Input id="country" bind:value={formData.country} required placeholder="USA" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="salesRepEmployeeNumber">Sales Rep Employee #</Label>
						<Input
							id="salesRepEmployeeNumber"
							type="number"
							bind:value={formData.salesRepEmployeeNumber}
							placeholder="1234"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="creditLimit">Credit Limit</Label>
						<Input id="creditLimit" bind:value={formData.creditLimit} placeholder="10000.00" />
					</div>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={loading}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Updating...' : 'Update Customer'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
