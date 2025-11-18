<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import EditCustomerDialog from '$lib/components/edit-customer-dialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let customer = $state(data.customer);
	let recentOrders = $state(data.recentOrders);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	async function refreshCustomer() {
		const response = await fetch(`/api/customers/${customer.customerNumber}`);
		if (response.ok) {
			const result = await response.json();
			customer = result.data;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const response = await fetch(`/api/customers/${customer.customerNumber}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				goto('/');
			}
		} catch (err) {
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	$effect(() => {
		customer = data.customer;
		recentOrders = data.recentOrders;
	});
</script>

<svelte:head>
    <title>Customer's info</title>
</svelte:head>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Customer Details</h1>
		<div class="flex gap-2">
			<Button variant="outline" onclick={() => (showEditDialog = true)}>
				<Pencil class="mr-2 size-4" />
				Edit
			</Button>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2 class="mr-2 size-4" />
				Delete
			</Button>
			<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
		</div>
	</div>

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
				<div>
					<div class="text-muted-foreground text-sm">Total Orders</div>
					<div class="font-medium">{customer.orderCount || 0}</div>
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

		<Card.Root class="border-border md:col-span-2">
			<Card.Header>
				<Card.Title>Recent Orders</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if recentOrders.length > 0}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Order #</Table.Head>
								<Table.Head>Order Date</Table.Head>
								<Table.Head>Required Date</Table.Head>
								<Table.Head>Shipped Date</Table.Head>
								<Table.Head>Status</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each recentOrders as order}
								<Table.Row>
									<Table.Cell class="font-medium">{order.orderNumber}</Table.Cell>
									<Table.Cell>
										{new Date(order.orderDate).toLocaleDateString()}
									</Table.Cell>
									<Table.Cell>
										{new Date(order.requiredDate).toLocaleDateString()}
									</Table.Cell>
									<Table.Cell>
										{order.shippedDate
											? new Date(order.shippedDate).toLocaleDateString()
											: '-'}
									</Table.Cell>
									<Table.Cell>
										<Badge
											variant={order.status === 'Shipped'
												? 'default'
												: order.status === 'Cancelled'
													? 'destructive'
													: 'secondary'}
										>
											{order.status}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<p class="text-muted-foreground text-sm">No orders found.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditCustomerDialog {customer} bind:open={showEditDialog} onSuccess={refreshCustomer} />

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete customer {customer.customerName}. This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDelete} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
