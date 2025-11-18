<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Plus, Check, ChevronsUpDown } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils.js';
	import type { Office } from '$lib/types/employee';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), onOpenChange, onSuccess }: Props = $props();

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		extension: '',
		officeCode: '',
		reportsTo: '',
		jobTitle: ''
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
				employees = data.data;
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
			firstName: '',
			lastName: '',
			email: '',
			extension: '',
			officeCode: '',
			reportsTo: '',
			jobTitle: ''
		};
		error = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/employees', {
				method: 'POST',
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
				toast.success('Employee created successfully');
				resetForm();
				open = false;
				if (onSuccess) onSuccess();
			} else {
				const errorMsg = result.error || 'Failed to create employee';
				error = errorMsg;
				toast.error(errorMsg);
			}
		} catch (err) {
			const errorMsg = 'Failed to create employee';
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
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Trigger>
		<Button variant="outline"><Plus /></Button>
	</Dialog.Trigger>
	<Dialog.Content class="border-border max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Add New Employee</Dialog.Title>
			<Dialog.Description>Enter employee information below.</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				{#if error}
					<div class="text-sm text-red-500">{error}</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="firstName">First Name *</Label>
						<Input id="firstName" bind:value={formData.firstName} required placeholder="John" />
					</div>
					<div class="grid gap-2">
						<Label for="lastName">Last Name *</Label>
						<Input id="lastName" bind:value={formData.lastName} required placeholder="Doe" />
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="email">Email *</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						required
						placeholder="john.doe@example.com"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="jobTitle">Job Title *</Label>
					<Input id="jobTitle" bind:value={formData.jobTitle} required placeholder="Sales Rep" />
				</div>

				<div class="grid gap-2">
					<Label for="extension">Extension *</Label>
					<Input id="extension" bind:value={formData.extension} required placeholder="x1234" />
				</div>

				<div class="grid gap-2">
					<Label for="officeCode">Office *</Label>
					<Select.Root type="single" bind:value={formData.officeCode}>
						<Select.Trigger>
							{offices.find((o) => o.officeCode === formData.officeCode)?.city || 'Select office'}
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
					<Label for="reportsTo">Reports To</Label>
					<Popover.Root bind:open={employeeSearchOpen}>
						<Popover.Trigger
							class="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
						>
							{#if formData.reportsTo}
								{(() => {
									const emp = employees.find(
										(e) => e.employeeNumber.toString() === formData.reportsTo
									);
									return emp
										? `${emp.firstName} ${emp.lastName} - ${emp.jobTitle}`
										: 'Select manager';
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
								<div class="max-h-[300px] overflow-y-auto p-1">
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
										{#each filteredEmployees as employee}
											<button
												type="button"
												class="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
												onclick={() => {
													formData.reportsTo = employee.employeeNumber.toString();
													employeeSearchOpen = false;
												}}
											>
												<Check
													class={cn(
														'mr-2 h-4 w-4',
														formData.reportsTo === employee.employeeNumber.toString()
															? 'opacity-100'
															: 'opacity-0'
													)}
												/>
												{employee.firstName} {employee.lastName} - {employee.jobTitle}
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
					{loading ? 'Adding...' : 'Add Employee'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
