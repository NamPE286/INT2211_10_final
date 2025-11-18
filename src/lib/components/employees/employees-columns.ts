import type { ColumnDef } from "@tanstack/table-core";
import type { Employee } from "$lib/types/employee";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import EmployeesCheckbox from "./employees-checkbox.svelte";
import SortableHeader from "../shared/sortable-header.svelte";

const createSortableHeader = (label: string) => {
	return ({ column }: any) => {
		return renderComponent(SortableHeader, { column, label });
	};
};

export const columns: ColumnDef<Employee>[] = [
	{
		id: "select",
		header: ({ table }) =>
			renderComponent(EmployeesCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate:
					table.getIsSomePageRowsSelected() &&
					!table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				"aria-label": "Select all",
			}),
		cell: ({ row }) =>
			renderComponent(EmployeesCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "employeeNumber",
		header: createSortableHeader("No"),
	},
	{
		accessorKey: "firstName",
		header: createSortableHeader("First Name"),
	},
	{
		accessorKey: "lastName",
		header: createSortableHeader("Last Name"),
	},
	{
		accessorKey: "email",
		header: createSortableHeader("Email"),
	},
	{
		accessorKey: "jobTitle",
		header: createSortableHeader("Job Title"),
	},
	{
		accessorKey: "city",
		header: createSortableHeader("Office City"),
	},
	{
		accessorKey: "country",
		header: createSortableHeader("Office Country"),
	},
	{
		accessorKey: "managerName",
		header: createSortableHeader("Manager"),
	},
];
