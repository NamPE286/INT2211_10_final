import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

export type OrderDetail = {
	orderNumber: number;
	productCode: string;
	productName: string;
	productLine: string;
	productScale: string;
	quantityOrdered: number;
	priceEach: string;
	orderLineNumber: number;
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [orderRows] = await connection.query(
			`SELECT o.*, c.customerName, c.customerNumber
			 FROM orders o
			 LEFT JOIN customers c ON o.customerNumber = c.customerNumber
			 WHERE o.orderNumber = ?`,
			[params.orderNumber]
		);

		if (!Array.isArray(orderRows) || orderRows.length === 0) {
			throw error(404, 'Order not found');
		}

		const [detailRows] = await connection.query(
			`SELECT od.*, p.productName, p.productLine, p.productScale
			 FROM orderdetails od
			 LEFT JOIN products p ON od.productCode = p.productCode
			 WHERE od.orderNumber = ?
			 ORDER BY od.orderLineNumber`,
			[params.orderNumber]
		);

		return {
			order: orderRows[0] as OrderWithCustomer,
			orderDetails: (detailRows as OrderDetail[]) || []
		};
	} catch (err) {
		console.error('Failed to fetch order:', err);
		throw error(500, 'Failed to fetch order details');
	}
};
