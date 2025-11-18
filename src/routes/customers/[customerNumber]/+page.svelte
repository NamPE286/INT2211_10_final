<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Customer } from '$lib/types/customer';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Card from '$lib/components/ui/card';

	let customer = $state<Customer | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchCustomer() {
		loading = true;
		error = null;
		try {
			const customerNumber = $page.params.customerNumber;
			const response = await fetch(`/api/customers/${customerNumber}`);
			const result = await response.json();

			if (response.ok) {
				customer = result.data;
			} else {
				error = result.error || 'Failed to fetch customer details';
			}
		} catch (err) {
			error = 'Failed to fetch customer details';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchCustomer();
	});
</script>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Customer Details</h1>
		<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
	</div>

	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<Spinner class="size-8" />
		</div>
	{:else if error}
		<div class="border-border rounded-md border bg-red-50 p-4 text-red-600">
			{error}
		</div>
	{:else if customer}
		<div class="grid gap-6 md:grid-cols-2">
			<Card.Root class="border-border">
				<Card.Header>
					<Card.Title>Basic Information</Card.Title>
				</Card.Header>
				<Card.Content class="border-border space-y-4">
					<div>
						<div class="text-muted-foreground text-sm">Customer Number</div>
						<div class="font-medium">{customer.customerNumber}</div>
					</div>
					<div>
						<div class="text-muted-foreground text-sm">Customer Name</div>
						<div class="font-medium">{customer.customerName}</div>
					</div>
					<div>
						<div class="text-muted-foreground text-sm">Credit Limit</div>
						<div class="font-medium">
							{new Intl.NumberFormat('en-US', {
								style: 'currency',
								currency: 'USD'
							}).format(parseFloat(customer.creditLimit))}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border">
				<Card.Header>
					<Card.Title>Contact Information</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<div class="text-muted-foreground text-sm">Contact Name</div>
						<div class="font-medium">
							{customer.contactFirstName}
							{customer.contactLastName}
						</div>
					</div>
					<div>
						<div class="text-muted-foreground text-sm">Phone</div>
						<div class="font-medium">{customer.phone}</div>
					</div>
					<div>
						<div class="text-muted-foreground text-sm">Sales Rep Employee Number</div>
						<div class="font-medium">{customer.salesRepEmployeeNumber}</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border md:col-span-2">
				<Card.Header>
					<Card.Title>Address</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<div class="text-muted-foreground text-sm">Address Line 1</div>
							<div class="font-medium">{customer.addressLine1}</div>
						</div>
						{#if customer.addressLine2}
							<div>
								<div class="text-muted-foreground text-sm">Address Line 2</div>
								<div class="font-medium">{customer.addressLine2}</div>
							</div>
						{/if}
						<div>
							<div class="text-muted-foreground text-sm">City</div>
							<div class="font-medium">{customer.city}</div>
						</div>
						{#if customer.state}
							<div>
								<div class="text-muted-foreground text-sm">State</div>
								<div class="font-medium">{customer.state}</div>
							</div>
						{/if}
						<div>
							<div class="text-muted-foreground text-sm">Postal Code</div>
							<div class="font-medium">{customer.postalCode}</div>
						</div>
						<div>
							<div class="text-muted-foreground text-sm">Country</div>
							<div class="font-medium">{customer.country}</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
