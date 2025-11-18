<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import EditOrderDialog from '$lib/components/edit-order-dialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Pencil, Trash2 } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let order = $state(data.order);
	let orderDetails = $state(data.orderDetails);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	const total = $derived(
		orderDetails.reduce(
			(sum, item) => sum + parseFloat(item.priceEach) * item.quantityOrdered,
			0
		)
	);

	async function refreshOrder() {
		const response = await fetch(`/api/orders/${order.orderNumber}`);
		if (response.ok) {
			const result = await response.json();
			order = result.data.order;
			orderDetails = result.data.details;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const response = await fetch(`/api/orders/${order.orderNumber}`, {
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
		order = data.order;
		orderDetails = data.orderDetails;
	});
</script>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Order #{order.orderNumber}</h1>
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
				<Card.Title>Order Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Order Number</div>
					<div class="font-medium">{order.orderNumber}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Status</div>
					<div>
						<Badge
							variant={order.status === 'Shipped'
								? 'default'
								: order.status === 'Cancelled'
									? 'destructive'
									: 'secondary'}
						>
							{order.status}
						</Badge>
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Order Date</div>
					<div class="font-medium">{new Date(order.orderDate).toLocaleDateString()}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Required Date</div>
					<div class="font-medium">{new Date(order.requiredDate).toLocaleDateString()}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Shipped Date</div>
					<div class="font-medium">
						{order.shippedDate ? new Date(order.shippedDate).toLocaleDateString() : 'Not shipped'}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Customer Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Customer Number</div>
					<div class="font-medium">{order.customerNumber}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Customer Name</div>
					<button
						class="font-medium text-primary hover:underline"
						onclick={() => goto(`/customers/${order.customerNumber}`)}
					>
						{order.customerName}
					</button>
				</div>
			</Card.Content>
		</Card.Root>

		{#if order.comments}
			<Card.Root class="border-border md:col-span-2">
				<Card.Header>
					<Card.Title>Comments</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-sm">{order.comments}</p>
				</Card.Content>
			</Card.Root>
		{/if}

		<Card.Root class="border-border md:col-span-2">
			<Card.Header>
				<Card.Title>Order Details</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Line</Table.Head>
							<Table.Head>Product Code</Table.Head>
							<Table.Head>Product Name</Table.Head>
							<Table.Head>Product Line</Table.Head>
							<Table.Head>Scale</Table.Head>
							<Table.Head class="text-right">Quantity</Table.Head>
							<Table.Head class="text-right">Price Each</Table.Head>
							<Table.Head class="text-right">Subtotal</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each orderDetails as detail}
							<Table.Row>
								<Table.Cell>{detail.orderLineNumber}</Table.Cell>
								<Table.Cell class="font-medium">{detail.productCode}</Table.Cell>
								<Table.Cell>{detail.productName}</Table.Cell>
								<Table.Cell>{detail.productLine}</Table.Cell>
								<Table.Cell>{detail.productScale}</Table.Cell>
								<Table.Cell class="text-right">{detail.quantityOrdered}</Table.Cell>
								<Table.Cell class="text-right">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD'
									}).format(parseFloat(detail.priceEach))}
								</Table.Cell>
								<Table.Cell class="text-right">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD'
									}).format(parseFloat(detail.priceEach) * detail.quantityOrdered)}
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={8} class="h-24 text-center">No items in this order.</Table.Cell>
							</Table.Row>
						{/each}
						{#if orderDetails.length > 0}
							<Table.Row>
								<Table.Cell colspan={7} class="text-right font-bold">Total:</Table.Cell>
								<Table.Cell class="text-right font-bold">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD'
									}).format(total)}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditOrderDialog {order} bind:open={showEditDialog} onSuccess={refreshOrder} />

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete order #{order.orderNumber}. This action cannot be undone.
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
