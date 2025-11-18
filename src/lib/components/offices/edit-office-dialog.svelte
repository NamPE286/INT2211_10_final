<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Office } from '$lib/types/employee';
	import { toast } from 'svelte-sonner';

	let {
		office,
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		office: Office;
		open: boolean;
		onSuccess?: () => void;
	} = $props();

	let submitting = $state(false);

	let formData = $state({
		city: office.city,
		phone: office.phone,
		addressLine1: office.addressLine1,
		addressLine2: office.addressLine2 || '',
		state: office.state || '',
		country: office.country,
		postalCode: office.postalCode,
		territory: office.territory
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;

		try {
			const response = await fetch(`/api/offices/${office.officeCode}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				toast.success('Office updated successfully');
				open = false;
				onSuccess();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update office');
			}
		} catch (err) {
			toast.error('Failed to update office');
			console.error(err);
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (open) {
			formData = {
				city: office.city,
				phone: office.phone,
				addressLine1: office.addressLine1,
				addressLine2: office.addressLine2 || '',
				state: office.state || '',
				country: office.country,
				postalCode: office.postalCode,
				territory: office.territory
			};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto border-border sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Office</Dialog.Title>
			<Dialog.Description>Update the office details.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label>Office Code</Label>
				<Input value={office.officeCode} disabled />
			</div>

			<div class="grid grid-cols-2 gap-4">
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
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="state">State</Label>
					<Input
						id="state"
						bind:value={formData.state}
						maxlength={50}
						disabled={submitting}
					/>
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

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={submitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Updating...' : 'Update Office'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
