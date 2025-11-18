<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, ChevronDown } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { Customer } from '$lib/types/customer';

	let { onSuccess = () => {} }: { onSuccess?: () => void } = $props();

	let open = $state(false);
	let submitting = $state(false);
	let customers = $state<Customer[]>([]);
	let searchQuery = $state('');
	let dropdownOpen = $state(false);
	let selectedCustomer = $state<Customer | null>(null);
	let searchTimeout: ReturnType<typeof setTimeout>;

	let formData = $state({
		customerNumber: '',
		checkNumber: '',
		paymentDate: '',
		amount: ''
	});

	async function searchCustomers(query: string) {
		try {
			const response = await fetch(`/api/customers?customerName=${encodeURIComponent(query)}&limit=5`);
			const data = await response.json();
			customers = data.data;
		} catch (err) {
			console.error('Failed to search customers:', err);
		}
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		
		clearTimeout(searchTimeout);
		
		if (searchQuery.trim()) {
			searchTimeout = setTimeout(() => {
				searchCustomers(searchQuery);
				dropdownOpen = true;
			}, 300);
		} else {
			customers = [];
			dropdownOpen = false;
		}
	}

	function selectCustomer(customer: Customer) {
		selectedCustomer = customer;
		formData.customerNumber = customer.customerNumber.toString();
		searchQuery = `${customer.customerName} (#${customer.customerNumber})`;
		dropdownOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.customer-dropdown-container')) {
			dropdownOpen = false;
		}
	}

	$effect(() => {
		if (dropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
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
		searchQuery = '';
		selectedCustomer = null;
		customers = [];
		dropdownOpen = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button variant="outline">
			<Plus />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="border-border max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Add New Payment</Dialog.Title>
			<Dialog.Description>Enter the payment details.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="customerSearch">Customer *</Label>
				<div class="relative customer-dropdown-container">
					<Input
						id="customerSearch"
						bind:value={searchQuery}
						oninput={handleSearchInput}
						onfocus={() => { if (customers.length > 0) dropdownOpen = true; }}
						placeholder="Search customer by name..."
						required
						disabled={submitting}
						autocomplete="off"
					/>
					<ChevronDown class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
					
					{#if dropdownOpen && customers.length > 0}
						<div 
							class="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
							role="listbox"
						>
							{#each customers as customer}
								<button
									type="button"
									class="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
									onclick={() => selectCustomer(customer)}
								>
									<div class="font-medium">{customer.customerName}</div>
									<div class="text-xs text-muted-foreground">#{customer.customerNumber}</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
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
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={submitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Creating...' : 'Create Payment'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
