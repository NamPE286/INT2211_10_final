import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Customer, Order } from '$lib/types/customer';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [customerRows] = await connection.query(
			`SELECT c.*, COUNT(o.orderNumber) as orderCount 
			 FROM customers c 
			 LEFT JOIN orders o ON c.customerNumber = o.customerNumber 
			 WHERE c.customerNumber = ? 
			 GROUP BY c.customerNumber`,
			[params.customerNumber]
		);

		if (!Array.isArray(customerRows) || customerRows.length === 0) {
			throw error(404, 'Customer not found');
		}

		const [orderRows] = await connection.query(
			`SELECT * FROM orders 
			 WHERE customerNumber = ? 
			 ORDER BY orderDate DESC 
			 LIMIT 10`,
			[params.customerNumber]
		);

		return {
			customer: customerRows[0] as Customer,
			recentOrders: (orderRows as Order[]) || []
		};
	} catch (err) {
		console.error('Failed to fetch customer:', err);
		throw error(500, 'Failed to fetch customer details');
	}
};
