<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { onSuccess = () => {} }: { onSuccess?: () => void } = $props();

	let open = $state(false);
	let submitting = $state(false);

	let formData = $state({
		officeCode: '',
		city: '',
		phone: '',
		addressLine1: '',
		addressLine2: '',
		state: '',
		country: '',
		postalCode: '',
		territory: ''
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;

		try {
			const response = await fetch('/api/offices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				toast.success('Office created successfully');
				open = false;
				resetForm();
				onSuccess();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to create office');
			}
		} catch (err) {
			toast.error('Failed to create office');
			console.error(err);
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		formData = {
			officeCode: '',
			city: '',
			phone: '',
			addressLine1: '',
			addressLine2: '',
			state: '',
			country: '',
			postalCode: '',
			territory: ''
		};
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
			<Dialog.Title>Add New Office</Dialog.Title>
			<Dialog.Description>Enter the details for the new office.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="officeCode">Office Code *</Label>
					<Input
						id="officeCode"
						bind:value={formData.officeCode}
						required
						maxlength={10}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="city">City *</Label>
					<Input
						id="city"
						bind:value={formData.city}
						required
						maxlength={50}
						disabled={submitting}
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="country">Country *</Label>
					<Input
						id="country"
						bind:value={formData.country}
						required
						maxlength={50}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="state">State</Label>
					<Input id="state" bind:value={formData.state} maxlength={50} disabled={submitting} />
				</div>
			</div>

			<div class="space-y-2">
				<Label for="addressLine1">Address Line 1 *</Label>
				<Input
					id="addressLine1"
					bind:value={formData.addressLine1}
					required
					maxlength={50}
					disabled={submitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="addressLine2">Address Line 2</Label>
				<Input
					id="addressLine2"
					bind:value={formData.addressLine2}
					maxlength={50}
					disabled={submitting}
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="postalCode">Postal Code *</Label>
					<Input
						id="postalCode"
						bind:value={formData.postalCode}
						required
						maxlength={15}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="phone">Phone *</Label>
					<Input
						id="phone"
						bind:value={formData.phone}
						required
						maxlength={50}
						disabled={submitting}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="territory">Territory *</Label>
				<Input
					id="territory"
					bind:value={formData.territory}
					required
					maxlength={10}
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
					{submitting ? 'Creating...' : 'Create Office'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
