<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	interface Product {
		productCode: string;
		productName: string;
		productLine: string;
		productScale: string;
		productVendor: string;
		productDescription: string;
		quantityInStock: number;
		buyPrice: string;
		MSRP: string;
	}

	interface Props {
		product: Product;
		open?: boolean;
		onSuccess?: () => void;
	}

	let { product, open = $bindable(false), onSuccess }: Props = $props();

	let formData = $state({
		productName: '',
		productLine: '',
		productScale: '',
		productVendor: '',
		productDescription: '',
		quantityInStock: '',
		buyPrice: '',
		MSRP: ''
	});

	let loading = $state(false);
	let error = $state<string | null>(null);
	let productLines = $state<string[]>([]);
	let loadingProductLines = $state(false);
	let showAddProductLine = $state(false);
	let newProductLine = $state('');

	async function fetchProductLines() {
		loadingProductLines = true;
		try {
			const response = await fetch('/api/products/productlines');
			const result = await response.json();
			
			if (response.ok) {
				productLines = result.data || [];
			} else {
				console.error('Failed to fetch product lines');
				productLines = [];
			}
		} catch (err) {
			console.error('Failed to fetch product lines:', err);
			productLines = [];
		} finally {
			loadingProductLines = false;
		}
	}

	async function addNewProductLine() {
		const trimmed = newProductLine.trim();
		if (!trimmed) return;

		if (productLines.includes(trimmed)) {
			formData.productLine = trimmed;
			newProductLine = '';
			showAddProductLine = false;
			return;
		}

		try {
			const response = await fetch('/api/products/productlines', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					productLine: trimmed
				})
			});

			const result = await response.json();

			if (response.ok) {
				productLines = [...productLines, trimmed];
				formData.productLine = trimmed;
				newProductLine = '';
				showAddProductLine = false;
				toast.success(`Product line "${trimmed}" created successfully`);
			} else {
				toast.error(result.error || 'Failed to create product line');
			}
		} catch (err) {
			console.error('Failed to create product line:', err);
			toast.error('Failed to create product line');
		}
	}

	function initializeForm() {
		formData = {
			productName: product.productName,
			productLine: product.productLine,
			productScale: product.productScale,
			productVendor: product.productVendor,
			productDescription: product.productDescription,
			quantityInStock: product.quantityInStock.toString(),
			buyPrice: product.buyPrice,
			MSRP: product.MSRP
		};
		error = null;
		showAddProductLine = false;
		newProductLine = '';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/products/${product.productCode}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					productName: formData.productName,
					productLine: formData.productLine,
					productScale: formData.productScale,
					productVendor: formData.productVendor,
					productDescription: formData.productDescription,
					quantityInStock: parseInt(formData.quantityInStock) || 0,
					buyPrice: formData.buyPrice || '0.00',
					MSRP: formData.MSRP || '0.00'
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Product updated successfully');
				open = false;
				if (onSuccess) onSuccess();
			} else {
				const errorMsg = result.error || 'Failed to update product';
				error = errorMsg;
				toast.error(errorMsg);
			}
		} catch (err) {
			const errorMsg = 'Failed to update product';
			error = errorMsg;
			toast.error(errorMsg);
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (newOpen) {
			initializeForm();
		}
	}

	onMount(() => {
		fetchProductLines();
		initializeForm();
	});

	$effect(() => {
		if (product) {
			initializeForm();
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="border-border max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Product</Dialog.Title>
			<Dialog.Description>Update product information below.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				{#if error}
					<div class="text-sm text-red-500">{error}</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="productCode">Product Code</Label>
						<Input
							id="productCode"
							value={product.productCode}
							disabled
							class="bg-muted"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="productScale">Scale *</Label>
						<Input
							id="productScale"
							bind:value={formData.productScale}
							required
							placeholder="1:10"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="productName">Product Name *</Label>
					<Input
						id="productName"
						bind:value={formData.productName}
						required
						placeholder="1969 Harley Davidson Ultimate Chopper"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="productLine">Product Line *</Label>
					{#if showAddProductLine}
						<div class="flex gap-2">
							<Input
								bind:value={newProductLine}
								placeholder="Enter new product line"
								class="flex-1"
							/>
							<Button type="button" size="sm" onclick={addNewProductLine}>
								Add
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onclick={() => {
									showAddProductLine = false;
									newProductLine = '';
								}}
							>
								Cancel
							</Button>
						</div>
					{:else}
						<div class="flex gap-2">
							<div class="flex-1">
								<Select.Root
									type="single"
									bind:value={formData.productLine}
									disabled={loadingProductLines}
								>
									<Select.Trigger>
										{formData.productLine || 'Select product line'}
									</Select.Trigger>
									<Select.Content class="border-border">
										{#each productLines as line (line)}
											<Select.Item value={line} label={line}>
												{line}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onclick={() => (showAddProductLine = true)}
							>
								<Plus class="size-4" />
							</Button>
						</div>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="productVendor">Vendor *</Label>
					<Input
						id="productVendor"
						bind:value={formData.productVendor}
						required
						placeholder="Min Lin Diecast"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="productDescription">Description *</Label>
					<Textarea
						id="productDescription"
						bind:value={formData.productDescription}
						required
						placeholder="Enter product description"
						rows={3}
					/>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<div class="grid gap-2">
						<Label for="quantityInStock">In Stock *</Label>
						<Input
							id="quantityInStock"
							type="number"
							bind:value={formData.quantityInStock}
							required
							placeholder="7933"
							min="0"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="buyPrice">Buy Price *</Label>
						<Input
							id="buyPrice"
							type="number"
							step="0.01"
							bind:value={formData.buyPrice}
							required
							placeholder="48.81"
							min="0"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="MSRP">MSRP *</Label>
						<Input
							id="MSRP"
							type="number"
							step="0.01"
							bind:value={formData.MSRP}
							required
							placeholder="95.70"
							min="0"
						/>
					</div>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={loading}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Updating...' : 'Update Product'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
