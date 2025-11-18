<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Database } from 'lucide-svelte';

	let { open = $bindable(false) } = $props();

	let host = $state('localhost');
	let port = $state(3307);
	let user = $state('root');
	let database = $state('classicmodels');
	let password = $state('6547');

	async function saveConfig() {
		try {
			const response = await fetch('/api/db-config', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					host,
					port,
					user,
					database,
					password
				})
			});

			if (response.ok) {
				open = false;
				window.location.reload();
			} else {
				alert('Failed to update database configuration');
			}
		} catch (error) {
			console.error('Error saving config:', error);
			alert('Error saving configuration');
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button variant="ghost" size="icon" aria-label="Edit database config">
			<Database class="h-5 w-5" />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="border-border sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Database Configuration</Dialog.Title>
			<Dialog.Description>
				Update your database connection settings. The application will reload after saving.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="host">Host</Label>
				<Input id="host" bind:value={host} placeholder="localhost" />
			</div>
			<div class="grid gap-2">
				<Label for="port">Port</Label>
				<Input id="port" type="number" bind:value={port} placeholder="3306" />
			</div>
			<div class="grid gap-2">
				<Label for="user">User</Label>
				<Input id="user" bind:value={user} placeholder="root" />
			</div>
			<div class="grid gap-2">
				<Label for="database">Database</Label>
				<Input id="database" bind:value={database} placeholder="classicmodels" />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" bind:value={password} />
			</div>
		</div>
		<Dialog.Footer>
			<Button onclick={saveConfig}>Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
