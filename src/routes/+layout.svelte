<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="bg-background border-border sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-4">
			<Sidebar.Trigger />
			<div class="flex-1">
				<h1 class="text-xl font-semibold">INT2211</h1>
			</div>
		</header>
		<main class="flex flex-1 flex-col px-5">
			{@render children()}
		</main>
	</Sidebar.Inset>
	<Sidebar.Rail />
</Sidebar.Provider>
<Toaster />
