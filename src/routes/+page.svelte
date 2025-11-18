<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import {
		Users,
		ShoppingCart,
		Package,
		Building2,
		CreditCard,
		Briefcase,
		TrendingUp,
		DollarSign
	} from 'lucide-svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	interface DashboardStats {
		totalCustomers: number;
		totalEmployees: number;
		totalOffices: number;
		totalOrders: number;
		totalProducts: number;
		totalPayments: number;
		totalRevenue: number;
		pendingOrders: number;
		shippedOrders: number;
		lowStockProducts: number;
	}

	let stats = $state<DashboardStats | null>(null);
	let loading = $state(true);

	async function fetchDashboardStats() {
		try {
			loading = true;
			const response = await fetch('/api/dashboard');
			const data = await response.json();
			stats = data.data;
		} catch (error) {
			console.error('Failed to fetch dashboard stats:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchDashboardStats();
	});

	const statCards = [
		{
			title: 'Total Customers',
			icon: Users,
			getValue: (s: DashboardStats) => s.totalCustomers.toLocaleString(),
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-100 dark:bg-blue-900/20',
			href: '/customers'
		},
		{
			title: 'Total Employees',
			icon: Briefcase,
			getValue: (s: DashboardStats) => s.totalEmployees.toLocaleString(),
			color: 'text-purple-600 dark:text-purple-400',
			bgColor: 'bg-purple-100 dark:bg-purple-900/20',
			href: '/employees'
		},
		{
			title: 'Total Offices',
			icon: Building2,
			getValue: (s: DashboardStats) => s.totalOffices.toLocaleString(),
			color: 'text-indigo-600 dark:text-indigo-400',
			bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
			href: '/offices'
		},
		{
			title: 'Total Orders',
			icon: ShoppingCart,
			getValue: (s: DashboardStats) => s.totalOrders.toLocaleString(),
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-100 dark:bg-green-900/20',
			href: '/orders'
		},
		{
			title: 'Total Products',
			icon: Package,
			getValue: (s: DashboardStats) => s.totalProducts.toLocaleString(),
			color: 'text-orange-600 dark:text-orange-400',
			bgColor: 'bg-orange-100 dark:bg-orange-900/20',
			href: '/products'
		},
		{
			title: 'Total Revenue',
			icon: DollarSign,
			getValue: (s: DashboardStats) =>
				`$${s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			color: 'text-emerald-600 dark:text-emerald-400',
			bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
			href: '/payments'
		},
		{
			title: 'Pending Orders',
			icon: TrendingUp,
			getValue: (s: DashboardStats) => s.pendingOrders.toLocaleString(),
			color: 'text-yellow-600 dark:text-yellow-400',
			bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
			href: '/orders'
		},
		{
			title: 'Low Stock Products',
			icon: Package,
			getValue: (s: DashboardStats) => s.lowStockProducts.toLocaleString(),
			color: 'text-red-600 dark:text-red-400',
			bgColor: 'bg-red-100 dark:bg-red-900/20',
			href: '/products'
		}
	];
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="container mx-auto py-10">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">Dashboard</h1>
		<p class="text-muted-foreground">Welcome to the Classic Models Management System</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#if loading}
			{#each Array(8) as _}
				<Card.Card class="border-border">
					<Card.CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-8 w-8 rounded-md" />
					</Card.CardHeader>
					<Card.CardContent>
						<Skeleton class="mb-1 h-8 w-24" />
						<Skeleton class="h-3 w-full" />
					</Card.CardContent>
				</Card.Card>
			{/each}
		{:else if stats}
			{#each statCards as card}
				<a href={card.href} class="transition-transform hover:scale-105">
					<Card.Card class="border-border h-full">
						<Card.CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.CardTitle class="text-sm font-medium">
								{card.title}
							</Card.CardTitle>
							<div class="rounded-md p-2 {card.bgColor}">
								<svelte:component this={card.icon} class="h-4 w-4 {card.color}" />
							</div>
						</Card.CardHeader>
						<Card.CardContent>
							<div class="text-2xl font-bold">{card.getValue(stats)}</div>
							<p class="text-muted-foreground mt-1 text-xs">Click to view details</p>
						</Card.CardContent>
					</Card.Card>
				</a>
			{/each}
		{:else}
			<div class="col-span-full py-10 text-center">
				<p class="text-muted-foreground">Failed to load dashboard data</p>
			</div>
		{/if}
	</div>

	{#if stats && !loading}
		<div class="mt-8 grid gap-6 md:grid-cols-2">
			<Card.Card class="border-border">
				<Card.CardHeader>
					<Card.CardTitle>Order Status Overview</Card.CardTitle>
					<Card.CardDescription>Current status of all orders</Card.CardDescription>
				</Card.CardHeader>
				<Card.CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-full bg-green-500"></div>
							<span class="text-sm">Shipped Orders</span>
						</div>
						<span class="font-semibold">{stats.shippedOrders.toLocaleString()}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
							<span class="text-sm">Pending Orders</span>
						</div>
						<span class="font-semibold">{stats.pendingOrders.toLocaleString()}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-full bg-blue-500"></div>
							<span class="text-sm">Total Orders</span>
						</div>
						<span class="font-semibold">{stats.totalOrders.toLocaleString()}</span>
					</div>
				</Card.CardContent>
			</Card.Card>

			<Card.Card class="border-border">
				<Card.CardHeader>
					<Card.CardTitle>Business Metrics</Card.CardTitle>
					<Card.CardDescription>Key performance indicators</Card.CardDescription>
				</Card.CardHeader>
				<Card.CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm">Average Revenue per Order</span>
						<span class="font-semibold">
							${stats.totalOrders > 0
								? (stats.totalRevenue / stats.totalOrders).toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									})
								: '0.00'}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Products per Order</span>
						<span class="font-semibold">
							{stats.totalOrders > 0 ? (stats.totalProducts / stats.totalOrders).toFixed(2) : '0'}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Customers per Employee</span>
						<span class="font-semibold">
							{stats.totalEmployees > 0
								? (stats.totalCustomers / stats.totalEmployees).toFixed(2)
								: '0'}
						</span>
					</div>
				</Card.CardContent>
			</Card.Card>
		</div>
	{/if}
</div>
