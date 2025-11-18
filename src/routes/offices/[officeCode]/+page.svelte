<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from './$types';
	import EditOfficeDialog from '$lib/components/offices/edit-office-dialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let office = $state(data.office);
	let employees = $state(data.employees);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);

	async function refreshOffice() {
		const response = await fetch(`/api/offices/${office.officeCode}`);
		if (response.ok) {
			const result = await response.json();
			office = result.data;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const response = await fetch(`/api/offices/${office.officeCode}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				toast.success('Office deleted successfully');
				goto('/offices');
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || 'Failed to delete office');
			}
		} catch (err) {
			toast.error('Failed to delete office');
			console.error(err);
		} finally {
			deleting = false;
		}
	}

	function handleEmployeeClick(employeeNumber: number) {
		goto(`/employees/${employeeNumber}`);
	}

	$effect(() => {
		office = data.office;
		employees = data.employees;
	});
</script>

<svelte:head>
	<title>Office Details</title>
</svelte:head>

<div class="container mx-auto py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Office Details</h1>
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
				<Card.Title>Office Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Office Code</div>
					<div class="font-medium">{office.officeCode}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">City</div>
					<div class="font-medium">{office.city}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Country</div>
					<div class="font-medium">{office.country}</div>
				</div>
				{#if office.state}
					<div>
						<div class="text-muted-foreground text-sm">State</div>
						<div class="font-medium">{office.state}</div>
					</div>
				{/if}
				<div>
					<div class="text-muted-foreground text-sm">Territory</div>
					<div class="font-medium">{office.territory}</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Contact Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-muted-foreground text-sm">Phone</div>
					<div class="font-medium">{office.phone}</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Address</div>
					<div class="font-medium">
						{office.addressLine1}
						{#if office.addressLine2}
							<br />{office.addressLine2}
						{/if}
					</div>
				</div>
				<div>
					<div class="text-muted-foreground text-sm">Postal Code</div>
					<div class="font-medium">{office.postalCode}</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="mt-6">
		<Card.Root class="border-border">
			<Card.Header>
				<Card.Title>Employees ({employees.length})</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if employees.length > 0}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Employee No</Table.Head>
								<Table.Head>Name</Table.Head>
								<Table.Head>Email</Table.Head>
								<Table.Head>Job Title</Table.Head>
								<Table.Head>Extension</Table.Head>
								<Table.Head>Manager</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each employees as employee}
								<Table.Row 
									class="cursor-pointer hover:bg-muted/50"
									onclick={() => handleEmployeeClick(employee.employeeNumber)}
								>
									<Table.Cell class="font-medium">{employee.employeeNumber}</Table.Cell>
									<Table.Cell>{employee.firstName} {employee.lastName}</Table.Cell>
									<Table.Cell>{employee.email}</Table.Cell>
									<Table.Cell>{employee.jobTitle}</Table.Cell>
									<Table.Cell>{employee.extension}</Table.Cell>
									<Table.Cell>
										{#if employee.managerName}
											<span class="text-primary">{employee.managerName}</span>
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<div class="text-muted-foreground py-8 text-center">
						No employees are assigned to this office.
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<EditOfficeDialog {office} bind:open={showEditDialog} onSuccess={refreshOffice} />

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content class="border-border">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete office {office.officeCode} ({office.city}). This action cannot be undone.
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
