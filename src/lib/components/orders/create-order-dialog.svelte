<script lang="ts">
	import type { Product } from '../products/products-columns.js';
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
		selectedProducts: Map<string, Product>;
		selectedCount: number;
		onSuccess?: () => void;
		onOpenChange?: (open: boolean) => void;
	}

	let { open = $bindable(), selectedProducts, selectedCount, onSuccess, onOpenChange }: Props = $props();

	let creatingOrder = $state(false);
	let orderCustomerNumber = $state('');
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
		orderCustomerNumber = customer.customerNumber.toString();
		customerSearchQuery = customer.customerName;
		searchedCustomers = [];
	}

	async function handleCreateOrder() {
		const products = Array.from(selectedProducts.values());

		if (products.length === 0 || !orderCustomerNumber) return;

		creatingOrder = true;

		try {
			const orderData = {
				customerNumber: parseInt(orderCustomerNumber),
				orderDate: new Date().toISOString().split('T')[0],
				requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				status: 'In Process',
				products: products.map((p) => ({
					productCode: p.productCode,
					quantityOrdered: 1,
					priceEach: p.MSRP
				}))
			};

			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(orderData)
			});

			const result = await response.json();

			if (response.ok) {
				open = false;
				resetForm();
				toast.success(
					`Order #${result.data.orderNumber} created successfully with ${products.length} product${products.length > 1 ? 's' : ''}`
				);

				if (result.data.orderNumber) {
					goto(`/orders/${result.data.orderNumber}`);
				}
			} else {
				const errorMessage = result.error || 'Failed to create order';
				toast.error(errorMessage);
			}
		} catch (err) {
			const errorMessage = 'Failed to create order';
			toast.error(errorMessage);
			console.error(err);
		} finally {
			creatingOrder = false;
		}
	}

	function resetForm() {
		orderCustomerNumber = '';
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
			<Dialog.Title>Create new order</Dialog.Title>
			<Dialog.Description>
				Create a new order with {selectedCount} selected product{selectedCount > 1 ? 's' : ''}.
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
					bind:value={orderCustomerNumber}
					placeholder="Enter customer number or search above"
					readonly={!!selectedCustomer}
				/>
			</div>
			<div class="text-muted-foreground text-sm">
				Note: This will create an order with default quantity of 1 for each product.
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={handleCancel}
				disabled={creatingOrder}
			>
				Cancel
			</Button>
			<Button onclick={handleCreateOrder} disabled={creatingOrder || !orderCustomerNumber}>
				{creatingOrder ? 'Creating...' : 'Create Order'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
