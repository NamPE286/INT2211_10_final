import type { ColumnDef } from "@tanstack/table-core";
import type { Office } from "$lib/types/employee";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import OfficesCheckbox from "./offices-checkbox.svelte";
import SortableHeader from "../shared/sortable-header.svelte";

const createSortableHeader = (label: string) => {
	return ({ column }: any) => {
		return renderComponent(SortableHeader, { column, label });
	};
};

export const columns: ColumnDef<Office>[] = [
	{
		id: "select",
		header: ({ table }) =>
			renderComponent(OfficesCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate:
					table.getIsSomePageRowsSelected() &&
					!table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				"aria-label": "Select all",
			}),
		cell: ({ row }) =>
			renderComponent(OfficesCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "officeCode",
		header: createSortableHeader("Office Code"),
	},
	{
		accessorKey: "city",
		header: createSortableHeader("City"),
	},
	{
		accessorKey: "country",
		header: createSortableHeader("Country"),
	},
	{
		accessorKey: "state",
		header: createSortableHeader("State"),
	},
	{
		accessorKey: "territory",
		header: createSortableHeader("Territory"),
	},
	{
		accessorKey: "phone",
		header: createSortableHeader("Phone"),
	},
];
