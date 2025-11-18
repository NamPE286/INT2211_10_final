<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils.js';
	import type { Employee, Office } from '$lib/types/employee';

	interface Props {
		employee: Employee;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: () => void;
	}

	let { employee, open = $bindable(false), onOpenChange, onSuccess }: Props = $props();

	let formData = $state({
		firstName: employee.firstName,
		lastName: employee.lastName,
		email: employee.email,
		extension: employee.extension,
		officeCode: employee.officeCode,
		reportsTo: employee.reportsTo?.toString() || '',
		jobTitle: employee.jobTitle
	});

	let offices = $state<Office[]>([]);
	let employees = $state<any[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let employeeSearchOpen = $state(false);
	let employeeSearchValue = $state('');
	let searchLoading = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	const LIMIT = 50;

	let filteredEmployees = $derived(employees);

	async function fetchEmployees(search: string = '') {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(async () => {
			searchLoading = true;
			try {
				const url = new URL('/api/employees', window.location.origin);
				url.searchParams.set('limit', LIMIT.toString());
				if (search) {
					url.searchParams.set('search', search);
				}
				const response = await fetch(url);
				const data = await response.json();
				employees = data.data.filter((e: any) => e.employeeNumber !== employee.employeeNumber);
			} catch (err) {
				console.error('Failed to fetch employees:', err);
			} finally {
				searchLoading = false;
			}
		}, 300);
	}

	onMount(async () => {
		try {
			const officesRes = await fetch('/api/offices');
			const officesData = await officesRes.json();
			offices = officesData.data;
			
			await fetchEmployees();
		} catch (err) {
			console.error('Failed to load form data:', err);
		}
	});

	$effect(() => {
		if (employeeSearchOpen) {
			fetchEmployees(employeeSearchValue);
		}
	});

	function resetForm() {
		formData = {
			firstName: employee.firstName,
			lastName: employee.lastName,
			email: employee.email,
			extension: employee.extension,
			officeCode: employee.officeCode,
			reportsTo: employee.reportsTo?.toString() || '',
			jobTitle: employee.jobTitle
		};
		error = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/employees/${employee.employeeNumber}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					reportsTo: formData.reportsTo ? parseInt(formData.reportsTo) : null
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Employee updated successfully');
				open = false;
				if (onSuccess) onSuccess();
			} else {
				const errorMsg = result.error || 'Failed to update employee';
				error = errorMsg;
				toast.error(errorMsg);
			}
		} catch (err) {
			const errorMsg = 'Failed to update employee';
			error = errorMsg;
			toast.error(errorMsg);
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (onOpenChange) onOpenChange(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}

	$effect(() => {
		resetForm();
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="border-border max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Employee</Dialog.Title>
			<Dialog.Description>Update employee information below.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				{#if error}
					<div class="text-sm text-red-500">{error}</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="edit-firstName">First Name *</Label>
						<Input
							id="edit-firstName"
							bind:value={formData.firstName}
							required
							placeholder="John"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="edit-lastName">Last Name *</Label>
						<Input
							id="edit-lastName"
							bind:value={formData.lastName}
							required
							placeholder="Doe"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="edit-email">Email *</Label>
					<Input
						id="edit-email"
						type="email"
						bind:value={formData.email}
						required
						placeholder="john.doe@example.com"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="edit-jobTitle">Job Title *</Label>
					<Input
						id="edit-jobTitle"
						bind:value={formData.jobTitle}
						required
						placeholder="Sales Rep"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="edit-extension">Extension *</Label>
					<Input
						id="edit-extension"
						bind:value={formData.extension}
						required
						placeholder="x1234"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="edit-officeCode">Office *</Label>
					<Select.Root type="single" bind:value={formData.officeCode}>
						<Select.Trigger>
							{offices.find(o => o.officeCode === formData.officeCode)?.city || 'Select office'}
						</Select.Trigger>
						<Select.Content class="border-border">
							{#each offices as office}
								<Select.Item value={office.officeCode} label="{office.city}, {office.country}">
									{office.city}, {office.country}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label for="edit-reportsTo">Reports To</Label>
					<Popover.Root bind:open={employeeSearchOpen}>
						<Popover.Trigger
							class="w-full justify-between inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
						>
							{#if formData.reportsTo}
								{(() => {
									const emp = employees.find(e => e.employeeNumber.toString() === formData.reportsTo);
									return emp ? `${emp.firstName} ${emp.lastName} - ${emp.jobTitle}` : 'Select manager';
								})()}
							{:else}
								Select manager (optional)
							{/if}
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Popover.Trigger>
						<Popover.Content class="w-[400px] p-0 border-border">
							<div class="flex flex-col">
								<div class="p-2 border-none">
									<Input
										class="h-9"
										placeholder="Search employees..."
										bind:value={employeeSearchValue}
									/>
								</div>
								<div class="max-h-[300px] overflow-y-auto p-1 border-none">
									{#if searchLoading}
										<div class="py-6 text-center text-sm text-muted-foreground">Searching...</div>
									{:else if filteredEmployees.length === 0}
										<div class="py-6 text-center text-sm text-muted-foreground">No employee found.</div>
									{:else}
										<button
											type="button"
											class="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
											onclick={() => {
												formData.reportsTo = '';
												employeeSearchOpen = false;
											}}
										>
											<Check
												class={cn(
													'mr-2 h-4 w-4',
													formData.reportsTo === '' ? 'opacity-100' : 'opacity-0'
												)}
											/>
											None
										</button>
										{#each filteredEmployees as emp}
											<button
												type="button"
												class="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
												onclick={() => {
													formData.reportsTo = emp.employeeNumber.toString();
													employeeSearchOpen = false;
												}}
											>
												<Check
													class={cn(
														'mr-2 h-4 w-4',
														formData.reportsTo === emp.employeeNumber.toString() ? 'opacity-100' : 'opacity-0'
													)}
												/>
												{emp.firstName} {emp.lastName} - {emp.jobTitle}
											</button>
										{/each}
									{/if}
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={loading}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Saving...' : 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
