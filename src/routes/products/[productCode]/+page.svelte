<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import EditProductDialog from '$lib/components/products/edit-product-dialog.svelte';
	import { Pencil } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let product = $state(data.product);
	let showEditDialog = $state(false);

	const stockStatus = $derived(
		product.quantityInStock > 100
			? { label: 'In Stock', variant: 'default' as const }
			: product.quantityInStock > 0
				? { label: 'Low Stock', variant: 'secondary' as const }
				: { label: 'Out of Stock', variant: 'destructive' as const }
	);

	async function refreshProduct() {
		const response = await fetch(`/api/products/${product.productCode}`);
		if (response.ok) {
			const result = await response.json();
			product = result.data;
		}
	}

	$effect(() => {
		product = data.product;
	});
</script>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">{product.productName}</h1>
		<div class="flex gap-2">
			<Button variant="outline" onclick={() => (showEditDialog = true)}>
				<Pencil class="mr-2 size-4" />
				Edit
			</Button>
			<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Product Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Product Code</div>
					<div class="font-medium">{product.productCode}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Product Name</div>
					<div class="font-medium">{product.productName}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Product Line</div>
					<div class="font-medium">{product.productLine}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Scale</div>
					<div class="font-medium">{product.productScale}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Vendor</div>
					<div class="font-medium">{product.productVendor}</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Pricing & Inventory</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Buy Price</div>
					<div class="font-medium">
						{new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD'
						}).format(parseFloat(product.buyPrice))}
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">MSRP</div>
					<div class="font-medium">
						{new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD'
						}).format(parseFloat(product.MSRP))}
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Profit Margin</div>
					<div class="font-medium">
						{new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD'
						}).format(parseFloat(product.MSRP) - parseFloat(product.buyPrice))}
						<span class="text-muted-foreground text-sm ml-2">
							({(((parseFloat(product.MSRP) - parseFloat(product.buyPrice)) / parseFloat(product.buyPrice)) * 100).toFixed(1)}%)
						</span>
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Quantity in Stock</div>
					<div class="flex items-center gap-2">
						<span class="font-medium">{product.quantityInStock}</span>
						<Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border md:col-span-2">
			<Card.Header>
				<Card.Title>Product Description</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-sm">{product.productDescription}</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditProductDialog {product} bind:open={showEditDialog} onSuccess={refreshProduct} />
