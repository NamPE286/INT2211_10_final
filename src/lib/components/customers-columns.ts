import type { ColumnDef } from "@tanstack/table-core";
import type { Customer } from "$lib/types/customer";
import { renderComponent, renderSnippet } from "$lib/components/ui/data-table/index.js";
import { createRawSnippet } from "svelte";
import CustomersCheckbox from "./customers-checkbox.svelte";

const createSortableHeader = (label: string) => {
	return ({ column }: any) => {
		const headerSnippet = createRawSnippet<[{ column: any; label: string }]>(
			(getProps) => {
				const { column, label } = getProps();
				const isSorted = column.getIsSorted();
				const sortIcon = isSorted === 'asc' ? '<span class="ml-1">↑</span>' : isSorted === 'desc' ? '<span class="ml-1">↓</span>' : '';
				const hoverIcon = isSorted ? '' : '<span class="ml-1 opacity-0 group-hover:opacity-50 transition-opacity">↕</span>';
				return {
					render: () => `
						<button
							class="flex items-center hover:text-foreground font-medium group w-full"
							data-column-id="${column.id}"
						>
							${label}${sortIcon}${hoverIcon}
						</button>
					`,
				};
			}
		);

		return renderSnippet(headerSnippet, { column, label });
	};
};

export const columns: ColumnDef<Customer>[] = [
	{
		id: "select",
		header: ({ table }) =>
			renderComponent(CustomersCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate:
					table.getIsSomePageRowsSelected() &&
					!table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				"aria-label": "Select all",
			}),
		cell: ({ row }) =>
			renderComponent(CustomersCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "customerNumber",
		header: createSortableHeader("No"),
	},
	{
		accessorKey: "customerName",
		header: createSortableHeader("Customer Name"),
		cell: ({ row }) => {
			const firstName = row.original.contactFirstName;
			const lastName = row.original.contactLastName;
			return `${firstName} ${lastName}`;
		},
	},
	{
		accessorKey: "phone",
		header: createSortableHeader("Phone"),
	},
	{
		accessorKey: "city",
		header: createSortableHeader("City"),
	},
	{
		accessorKey: "state",
		header: createSortableHeader("State"),
	},
	{
		accessorKey: "country",
		header: createSortableHeader("Country"),
	},
	{
		accessorKey: "creditLimit",
		header: () => {
			const creditLimitHeaderSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">Credit Limit</div>`,
			}));
			return renderSnippet(creditLimitHeaderSnippet);
		},
		cell: ({ row }) => {
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			});

			const creditLimitCellSnippet = createRawSnippet<[{ creditLimit: string }]>(
				(getCreditLimit) => {
					const { creditLimit } = getCreditLimit();
					const formatted = formatter.format(parseFloat(creditLimit));
					return {
						render: () =>
							`<div class="text-right font-medium">${formatted}</div>`,
					};
				}
			);

			return renderSnippet(creditLimitCellSnippet, {
				creditLimit: row.original.creditLimit,
			});
		},
	},
];
