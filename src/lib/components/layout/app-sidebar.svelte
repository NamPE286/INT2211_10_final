<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Users, ShoppingCart, Moon, Sun, Home, Package, Briefcase, Building2, CreditCard } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Button } from '$lib/components/ui/button';

	const navItems = [
		{
			title: 'Customers',
			url: '/',
			icon: Users
		},
		{
			title: 'Employees',
			url: '/employees',
			icon: Briefcase
		},
		{
			title: 'Offices',
			url: '/offices',
			icon: Building2
		},
		{
			title: 'Orders',
			url: '/orders',
			icon: ShoppingCart
		},
		{
			title: 'Products',
			url: '/products',
			icon: Package
		},
		{
			title: 'Payments',
			url: '/payments',
			icon: CreditCard
		}
	];
</script>

<Sidebar.Root collapsible="icon" class="border-border">
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel class="mb-4">
				<a href="/" class="flex items-center gap-2 text-lg font-bold"> INT2211 </a>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={$page.url.pathname === item.url}
								tooltipContent={item.title}
							>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<svelte:component this={item.icon} />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					tooltipContent={themeStore.value === 'dark' ? 'Light Mode' : 'Dark Mode'}
				>
					{#snippet child({ props })}
						<button {...props} onclick={() => themeStore.toggle()}>
							{#if themeStore.value === 'dark'}
								<Sun class="h-5 w-5" />
								<span>Light Mode</span>
							{:else}
								<Moon class="h-5 w-5" />
								<span>Dark Mode</span>
							{/if}
						</button>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
