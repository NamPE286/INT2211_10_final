<script lang="ts">
	import type { OrderWithCustomer } from './orders-columns.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { Customer } from '$lib/types/customer.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	interface Props {
		open: boolean;
		selectedOrders: Map<string, OrderWithCustomer>;
		selectedCount: number;
		onSuccess?: () => void;
		onOpenChange?: (open: boolean) => void;
	}

	let { open = $bindable(), selectedOrders, selectedCount, onSuccess, onOpenChange }: Props = $props();

	let assigning = $state(false);
	let newCustomerNumber = $state('');
	let customerSearchQuery = $state('');
	let searchedCustomers = $state<Customer[]>([]);
	let loadingCustomers = $state(false);
	let selectedCustomer = $state<Customer | null>(null);

	async function searchCustomers() {
		if (!customerSearchQuery.trim()) {
			searchedCustomers = [];
			return;
		}

		loadingCustomers = true;
		try {
			const params = new URLSearchParams({
				customerName: customerSearchQuery,
				limit: '10'
			});
			const response = await fetch(`/api/customers?${params}`);
			const json = await response.json();

			if (response.ok) {
				searchedCustomers = json.data;
			} else {
				searchedCustomers = [];
			}
		} catch (err) {
			console.error('Failed to search customers:', err);
			searchedCustomers = [];
		} finally {
			loadingCustomers = false;
		}
	}

	function selectCustomer(customer: Customer) {
		selectedCustomer = customer;
		newCustomerNumber = customer.customerNumber.toString();
		customerSearchQuery = customer.customerName;
		searchedCustomers = [];
	}

	async function handleAssignToCustomer() {
		const orderNumbers = Array.from(selectedOrders.values()).map((order) => order.orderNumber);

		if (orderNumbers.length === 0 || !newCustomerNumber) return;

		assigning = true;
		try {
			const results = await Promise.all(
				orderNumbers.map((orderNumber) =>
					fetch(`/api/orders/${orderNumber}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							customerNumber: parseInt(newCustomerNumber)
						})
					})
				)
			);

			const allSuccess = results.every((res) => res.ok);
			if (allSuccess) {
				open = false;
				resetForm();
				toast.success(
					`Successfully assigned ${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''}`
				);
				onSuccess?.();
			} else {
				const errorMessage = 'Some orders could not be updated';
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to assign orders';
			toast.error(errorMessage);
			console.error(err);
		} finally {
			assigning = false;
		}
	}

	function resetForm() {
		newCustomerNumber = '';
		customerSearchQuery = '';
		selectedCustomer = null;
		searchedCustomers = [];
	}

	function handleCancel() {
		open = false;
		resetForm();
	}

	$effect(() => {
		if (onOpenChange) {
			onOpenChange(open);
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="border-border">
		<Dialog.Header>
			<Dialog.Title>Assign orders to customer</Dialog.Title>
			<Dialog.Description>
				Assign {selectedCount} selected order{selectedCount > 1 ? 's' : ''} to a customer.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="customerSearch">Search Customer by Name</Label>
				<div class="relative">
					<Input
						id="customerSearch"
						type="text"
						bind:value={customerSearchQuery}
						oninput={searchCustomers}
						placeholder="Type customer name to search..."
					/>
					{#if loadingCustomers}
						<div class="absolute top-1/2 right-3 -translate-y-1/2">
							<Spinner class="size-4" />
						</div>
					{/if}
				</div>
				{#if searchedCustomers.length > 0}
					<div class="border-border mt-1 max-h-48 overflow-y-auto rounded-md border">
						{#each searchedCustomers as customer (customer.customerNumber)}
							<div class="hover:bg-accent flex items-center gap-2 px-3 py-2 transition-colors">
								<button
									type="button"
									class="flex-1 text-left text-sm"
									onclick={() => selectCustomer(customer)}
								>
									<div class="font-medium">{customer.customerName}</div>
									<div class="text-muted-foreground text-xs">
										#{customer.customerNumber} • {customer.city}, {customer.country}
									</div>
								</button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => goto(`/customers/${customer.customerNumber}`)}
								>
									View
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{#if selectedCustomer}
				<div class="bg-muted rounded-md p-3">
					<div class="flex items-center justify-between">
						<div>
							<div class="text-sm font-medium">Selected Customer:</div>
							<div class="mt-1 text-sm">{selectedCustomer.customerName}</div>
							<div class="text-muted-foreground text-xs">
								Customer #{selectedCustomer.customerNumber}
							</div>
						</div>
						<Button
							size="sm"
							variant="outline"
							onclick={() => {
								if (selectedCustomer) {
									goto(`/customers/${selectedCustomer.customerNumber}`);
								}
							}}
						>
							View
						</Button>
					</div>
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="customerNumber">Customer Number</Label>
				<Input
					id="customerNumber"
					type="number"
					bind:value={newCustomerNumber}
					placeholder="Enter customer number or search above"
					readonly={!!selectedCustomer}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={handleCancel}
				disabled={assigning}
			>
				Cancel
			</Button>
			<Button onclick={handleAssignToCustomer} disabled={assigning || !newCustomerNumber}>
				{assigning ? 'Assigning...' : 'Assign'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
