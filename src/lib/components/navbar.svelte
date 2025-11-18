<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Moon, Sun } from 'lucide-svelte';
</script>

<nav class="border-b">
	<div class="container mx-auto px-4 py-3 flex items-center justify-between">
		<div class="flex items-center gap-8">
			<a href="/" class="text-xl font-bold">MyApp</a>
			<div class="hidden md:flex items-center gap-6">
				<a href="/" class="text-sm hover:text-primary transition-colors">Home</a>
				<a href="/about" class="text-sm hover:text-primary transition-colors">About</a>
				<a href="/contact" class="text-sm hover:text-primary transition-colors">Contact</a>
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
