import type { ColumnDef } from "@tanstack/table-core";
import { renderComponent, renderSnippet } from "$lib/components/ui/data-table/index.js";
import { createRawSnippet } from "svelte";
import SortableHeader from "./sortable-header.svelte";

const createSortableHeader = (label: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ({ column }: { column: any }) => {
		return renderComponent(SortableHeader, { column, label });
	};
};

export type Product = {
	productCode: string;
	productName: string;
	productLine: string;
	productScale: string;
	productVendor: string;
	productDescription: string;
	quantityInStock: number;
	buyPrice: string;
	MSRP: string;
};

export const columns: ColumnDef<Product>[] = [
	{
		accessorKey: "productCode",
		header: createSortableHeader("Code"),
	},
	{
		accessorKey: "productName",
		header: createSortableHeader("Product Name"),
	},
	{
		accessorKey: "productLine",
		header: createSortableHeader("Product Line"),
	},
	{
		accessorKey: "productScale",
		header: createSortableHeader("Scale"),
	},
	{
		accessorKey: "productVendor",
		header: createSortableHeader("Vendor"),
	},
	{
		accessorKey: "quantityInStock",
		header: () => {
			const quantityHeaderSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">In Stock</div>`,
			}));
			return renderSnippet(quantityHeaderSnippet);
		},
		cell: ({ row }) => {
			const quantityCellSnippet = createRawSnippet<[{ quantity: number }]>(
				(getQuantity) => {
					const { quantity } = getQuantity();
					return {
						render: () =>
							`<div class="text-right font-medium">${quantity}</div>`,
					};
				}
			);

			return renderSnippet(quantityCellSnippet, {
				quantity: row.original.quantityInStock,
			});
		},
	},
	{
		accessorKey: "buyPrice",
		header: () => {
			const buyPriceHeaderSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">Buy Price</div>`,
			}));
			return renderSnippet(buyPriceHeaderSnippet);
		},
		cell: ({ row }) => {
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			});

			const buyPriceCellSnippet = createRawSnippet<[{ price: string }]>(
				(getPrice) => {
					const { price } = getPrice();
					const formatted = formatter.format(parseFloat(price));
					return {
						render: () =>
							`<div class="text-right font-medium">${formatted}</div>`,
					};
				}
			);

			return renderSnippet(buyPriceCellSnippet, {
				price: row.original.buyPrice,
			});
		},
	},
	{
		accessorKey: "MSRP",
		header: () => {
			const msrpHeaderSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">MSRP</div>`,
			}));
			return renderSnippet(msrpHeaderSnippet);
		},
		cell: ({ row }) => {
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			});

			const msrpCellSnippet = createRawSnippet<[{ price: string }]>(
				(getPrice) => {
					const { price } = getPrice();
					const formatted = formatter.format(parseFloat(price));
					return {
						render: () =>
							`<div class="text-right font-medium">${formatted}</div>`,
					};
				}
			);

			return renderSnippet(msrpCellSnippet, {
				price: row.original.MSRP,
			});
		},
	},
];
