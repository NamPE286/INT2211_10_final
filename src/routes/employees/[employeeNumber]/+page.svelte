<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import EditEmployeeDialog from '$lib/components/employees/edit-employee-dialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let employee = $state(data.employee);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	async function refreshEmployee() {
		const response = await fetch(`/api/employees/${employee.employeeNumber}`);
		if (response.ok) {
			const result = await response.json();
			employee = result.data;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const response = await fetch(`/api/employees/${employee.employeeNumber}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				toast.success('Employee deleted successfully');
				goto('/employees');
			} else {
				toast.error('Failed to delete employee');
			}
		} catch (err) {
			toast.error('Failed to delete employee');
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	$effect(() => {
		employee = data.employee;
	});
</script>

<svelte:head>
	<title>Employee's info</title>
</svelte:head>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Employee Details</h1>
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
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Employee Number</div>
					<div class="font-medium">{employee.employeeNumber}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Full Name</div>
					<div class="font-medium">{employee.firstName} {employee.lastName}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Job Title</div>
					<div class="font-medium">{employee.jobTitle}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Email</div>
					<div class="font-medium">{employee.email}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Extension</div>
					<div class="font-medium">{employee.extension}</div>
				</div>
				{#if employee.managerName}
					<div>
						<div class="text-muted-foreground text-sm">Reports To</div>
						<div class="font-medium">{employee.managerName}</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Office Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Office Code</div>
					<div class="font-medium">{employee.officeCode}</div>
				</div>
				{#if employee.city}
					<div>
						<div class="text-muted-foreground text-sm">City</div>
						<div class="font-medium">{employee.city}</div>
					</div>
				{/if}
				{#if employee.country}
					<div>
						<div class="text-muted-foreground text-sm">Country</div>
						<div class="font-medium">{employee.country}</div>
					</div>
				{/if}
				{#if employee.state}
					<div>
						<div class="text-muted-foreground text-sm">State</div>
						<div class="font-medium">{employee.state}</div>
					</div>
				{/if}
				{#if employee.phone}
					<div>
						<div class="text-muted-foreground text-sm">Office Phone</div>
						<div class="font-medium">{employee.phone}</div>
					</div>
				{/if}
				{#if employee.addressLine1}
					<div>
						<div class="text-muted-foreground text-sm">Office Address</div>
						<div class="font-medium">
							{employee.addressLine1}
							{#if employee.addressLine2}
								<br />{employee.addressLine2}
							{/if}
						</div>
					</div>
				{/if}
				{#if employee.postalCode}
					<div>
						<div class="text-muted-foreground text-sm">Postal Code</div>
						<div class="font-medium">{employee.postalCode}</div>
					</div>
				{/if}
				{#if employee.territory}
					<div>
						<div class="text-muted-foreground text-sm">Territory</div>
						<div class="font-medium">{employee.territory}</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditEmployeeDialog {employee} bind:open={showEditDialog} onSuccess={refreshEmployee} />

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete employee {employee.firstName}
				{employee.lastName}. This action cannot be undone.
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
