import type { ColumnDef } from "@tanstack/table-core";
import type { Payment } from "$lib/types/customer";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import PaymentsCheckbox from "./payments-checkbox.svelte";
import SortableHeader from "../shared/sortable-header.svelte";

const createSortableHeader = (label: string) => {
	return ({ column }: any) => {
		return renderComponent(SortableHeader, { column, label });
	};
};

export const columns: ColumnDef<Payment & { customerName?: string }>[] = [
	{
		id: "select",
		header: ({ table }) =>
			renderComponent(PaymentsCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate:
					table.getIsSomePageRowsSelected() &&
					!table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				"aria-label": "Select all",
			}),
		cell: ({ row }) =>
			renderComponent(PaymentsCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "checkNumber",
		header: createSortableHeader("Check Number"),
	},
	{
		accessorKey: "customerNumber",
		header: createSortableHeader("Customer No"),
	},
	{
		accessorKey: "customerName",
		header: createSortableHeader("Customer Name"),
	},
	{
		accessorKey: "paymentDate",
		header: createSortableHeader("Payment Date"),
		cell: ({ row }) => {
			const date = new Date(row.getValue("paymentDate"));
			return date.toLocaleDateString();
		},
	},
	{
		accessorKey: "amount",
		header: createSortableHeader("Amount"),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("amount"));
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(amount);
		},
	},
];
