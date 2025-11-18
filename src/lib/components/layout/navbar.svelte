<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Moon, Sun } from 'lucide-svelte';
</script>

<nav class="bg-background border-border sticky top-0 z-50 border">
	<div class="container mx-auto flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-8">
			<a href="/" class="text-xl font-bold">INT2211</a>
			<div class="hidden items-center gap-6 md:flex">
				<a href="/" class="hover:text-primary text-sm transition-colors">Customers</a>
				<a href="/orders" class="hover:text-primary text-sm transition-colors">Orders</a>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				onclick={() => themeStore.toggle()}
				aria-label="Toggle theme"
			>
				{#if themeStore.value === 'dark'}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</Button>
		</div>
	</div>
</nav>
