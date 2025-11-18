<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import EditPaymentDialog from '$lib/components/payments/edit-payment-dialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let payment = $state(data.payment);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	async function refreshPayment() {
		const response = await fetch(
			`/api/payments/${payment.customerNumber}/${payment.checkNumber}`
		);
		if (response.ok) {
			const result = await response.json();
			payment = result.data;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const response = await fetch(
				`/api/payments/${payment.customerNumber}/${payment.checkNumber}`,
				{
					method: 'DELETE'
				}
			);

			if (response.ok) {
				toast.success('Payment deleted successfully');
				goto('/payments');
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || 'Failed to delete payment');
			}
		} catch (err) {
			toast.error('Failed to delete payment');
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	function handleCustomerClick() {
		goto(`/customers/${payment.customerNumber}`);
	}

	$effect(() => {
		payment = data.payment;
	});
</script>

<svelte:head>
	<title>Payment Details</title>
</svelte:head>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Payment Details</h1>
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
				<Card.Title>Payment Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Check Number</div>
					<div class="font-medium">{payment.checkNumber}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Payment Date</div>
					<div class="font-medium">
						{new Date(payment.paymentDate).toLocaleDateString()}
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Amount</div>
					<div class="text-2xl font-bold">
						{new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD'
						}).format(parseFloat(payment.amount))}
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
					<button
						onclick={handleCustomerClick}
						class="font-medium text-primary hover:underline"
					>
						#{payment.customerNumber}
					</button>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Customer Name</div>
					<button
						onclick={handleCustomerClick}
						class="font-medium text-primary hover:underline"
					>
						{payment.customerName}
					</button>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Contact Person</div>
					<div class="font-medium">
						{payment.contactFirstName}
						{payment.contactLastName}
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Phone</div>
					<div class="font-medium">{payment.phone}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Address</div>
					<div class="font-medium">
						{payment.addressLine1}
						{#if payment.addressLine2}
							<br />{payment.addressLine2}
						{/if}
						<br />{payment.city}{#if payment.state}, {payment.state}{/if}
						{payment.postalCode}
						<br />{payment.country}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditPaymentDialog {payment} bind:open={showEditDialog} onSuccess={refreshPayment} />

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete payment {payment.checkNumber} for customer {payment.customerName}. This action cannot be undone.
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
