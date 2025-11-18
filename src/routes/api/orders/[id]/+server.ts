import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [orderRows] = await connection.query(
			`SELECT o.*, c.customerName, c.customerNumber
			 FROM orders o
			 LEFT JOIN customers c ON o.customerNumber = c.customerNumber
			 WHERE o.orderNumber = ?`,
			[params.id]
		);

		if (Array.isArray(orderRows) && orderRows.length === 0) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		const [detailRows] = await connection.query(
			`SELECT od.*, p.productName, p.productLine, p.productScale
			 FROM orderdetails od
			 LEFT JOIN products p ON od.productCode = p.productCode
			 WHERE od.orderNumber = ?
			 ORDER BY od.orderLineNumber`,
			[params.id]
		);

		return json({
			success: true,
			data: {
				order: Array.isArray(orderRows) ? orderRows[0] : orderRows,
				details: detailRows || []
			}
		});
	} catch (err) {
		console.error(err);
		return json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
	}
};
