import type { ColumnDef } from "@tanstack/table-core";
import { renderComponent, renderSnippet } from "$lib/components/ui/data-table/index.js";
import { createRawSnippet } from "svelte";
import SortableHeader from "./sortable-header.svelte";
import OrdersCheckbox from "./orders-checkbox.svelte";

const createSortableHeader = (label: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ({ column }: { column: any }) => {
		return renderComponent(SortableHeader, { column, label });
	};
};

export type OrderWithCustomer = {
	orderNumber: number;
	orderDate: string;
	requiredDate: string;
	shippedDate: string | null;
	status: string;
	comments: string | null;
	customerNumber: number;
	customerName: string;
};

export const columns: ColumnDef<OrderWithCustomer>[] = [
	{
		id: "select",
		header: ({ table }) =>
			renderComponent(OrdersCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate:
					table.getIsSomePageRowsSelected() &&
					!table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				"aria-label": "Select all",
			}),
		cell: ({ row }) =>
			renderComponent(OrdersCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "orderNumber",
		header: createSortableHeader("Order #"),
	},
	{
		accessorKey: "orderDate",
		header: createSortableHeader("Order Date"),
		cell: ({ row }) => {
			const orderDateCellSnippet = createRawSnippet<[{ date: string }]>(
				(getDate) => {
					const { date } = getDate();
					const formatted = new Date(date).toLocaleDateString();
					return {
						render: () => `<div>${formatted}</div>`,
					};
				}
			);

			return renderSnippet(orderDateCellSnippet, {
				date: row.original.orderDate,
			});
		},
	},
	{
		accessorKey: "requiredDate",
		header: createSortableHeader("Required Date"),
		cell: ({ row }) => {
			const requiredDateCellSnippet = createRawSnippet<[{ date: string }]>(
				(getDate) => {
					const { date } = getDate();
					const formatted = new Date(date).toLocaleDateString();
					return {
						render: () => `<div>${formatted}</div>`,
					};
				}
			);

			return renderSnippet(requiredDateCellSnippet, {
				date: row.original.requiredDate,
			});
		},
	},
	{
		accessorKey: "shippedDate",
		header: createSortableHeader("Shipped Date"),
		cell: ({ row }) => {
			const shippedDateCellSnippet = createRawSnippet<[{ date: string | null }]>(
				(getDate) => {
					const { date } = getDate();
					const formatted = date ? new Date(date).toLocaleDateString() : '-';
					return {
						render: () => `<div>${formatted}</div>`,
					};
				}
			);

			return renderSnippet(shippedDateCellSnippet, {
				date: row.original.shippedDate,
			});
		},
	},
	{
		accessorKey: "status",
		header: createSortableHeader("Status"),
		cell: ({ row }) => {
			const status = row.original.status;
			let variant: "default" | "secondary" | "destructive" = "secondary";
			
			if (status === "Shipped") {
				variant = "default";
			} else if (status === "Cancelled") {
				variant = "destructive";
			}

			const statusCellSnippet = createRawSnippet<[{ status: string; variant: string }]>(
				(getData) => {
					const { status, variant } = getData();
					return {
						render: () => 
							`<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
								variant === 'default' ? 'bg-primary text-primary-foreground' :
								variant === 'destructive' ? 'bg-destructive text-destructive-foreground' :
								'bg-secondary text-secondary-foreground'
							}">${status}</span>`,
					};
				}
			);

			return renderSnippet(statusCellSnippet, { status, variant });
		},
	},
	{
		accessorKey: "customerName",
		header: createSortableHeader("Customer"),
		cell: ({ row }) => {
			const customerNameCellSnippet = createRawSnippet<[{ name: string; number: number }]>(
				(getData) => {
					const { name, number } = getData();
					return {
						render: () => 
							`<button type="button" class="text-primary hover:underline text-left" data-customer-link="${number}">${name}</button>`,
					};
				}
			);

			return renderSnippet(customerNameCellSnippet, {
				name: row.original.customerName,
				number: row.original.customerNumber
			});
		},
	},
	{
		accessorKey: "customerNumber",
		header: createSortableHeader("Customer #"),
		cell: ({ row }) => {
			const customerNumberCellSnippet = createRawSnippet<[{ number: number }]>(
				(getData) => {
					const { number } = getData();
					return {
						render: () => 
							`<button type="button" class="text-primary hover:underline" data-customer-link="${number}">${number}</button>`,
					};
				}
			);

			return renderSnippet(customerNumberCellSnippet, {
				number: row.original.customerNumber
			});
		},
	},
];
