import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = url.searchParams.get('limit') || '50';
		const offset = url.searchParams.get('offset') || '0';
		const sortBy = url.searchParams.get('sortBy') || 'orderDate';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';

		const filterableColumns = [
			'orderNumber',
			'status',
			'customerNumber',
			'customerName'
		];

		let filterColumn: string | null = null;
		let filterValue: string | null = null;

		for (const column of filterableColumns) {
			const value = url.searchParams.get(column);

			if (value) {
				filterColumn = column;
				filterValue = value;
				break;
			}
		}

		let query = `
			SELECT o.*, c.customerName 
			FROM orders o 
			LEFT JOIN customers c ON o.customerNumber = c.customerNumber
		`;

		if (filterColumn && filterValue) {
			if (filterColumn === 'customerName') {
				query += ` WHERE c.customerName LIKE '%${filterValue}%'`;
			} else {
				query += ` WHERE o.${filterColumn} LIKE '%${filterValue}%'`;
			}
		}

		query += ` ORDER BY o.${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

		const [rows] = await connection.query(query);

		return json({ data: rows });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch orders' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { customerNumber, orderDate, requiredDate, shippedDate, status, comments, products } = body;

		if (!customerNumber || !orderDate || !requiredDate || !status) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!products || !Array.isArray(products) || products.length === 0) {
			return json({ error: 'At least one product is required' }, { status: 400 });
		}

		await connection.beginTransaction();

		try {
			const [maxResult] = await connection.query('SELECT MAX(orderNumber) as maxOrderNumber FROM orders');
			const maxOrderNumber = Array.isArray(maxResult) && maxResult.length > 0 
				? ((maxResult[0] as { maxOrderNumber: number | null }).maxOrderNumber || 0)
				: 0;
			const newOrderNumber = maxOrderNumber + 1;

			await connection.query(
				'INSERT INTO orders (orderNumber, customerNumber, orderDate, requiredDate, shippedDate, status, comments) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[newOrderNumber, customerNumber, orderDate, requiredDate, shippedDate || null, status, comments || null]
			);

			for (let i = 0; i < products.length; i++) {
				const product = products[i];
				const quantityOrdered = product.quantityOrdered || 1;
				const [stockResult] = await connection.query(
					'SELECT quantityInStock FROM products WHERE productCode = ?',
					[product.productCode]
				);

				if (!Array.isArray(stockResult) || stockResult.length === 0) {
					throw new Error(`Product ${product.productCode} not found`);
				}

				const currentStock = (stockResult[0] as { quantityInStock: number }).quantityInStock;

				if (currentStock < quantityOrdered) {
					throw new Error(`Insufficient stock for product ${product.productCode}. Available: ${currentStock}, Requested: ${quantityOrdered}`);
				}

				await connection.query(
					'INSERT INTO orderdetails (orderNumber, productCode, quantityOrdered, priceEach, orderLineNumber) VALUES (?, ?, ?, ?, ?)',
					[
						newOrderNumber,
						product.productCode,
						quantityOrdered,
						product.priceEach,
						i + 1
					]
				);

				await connection.query(
					'UPDATE products SET quantityInStock = quantityInStock - ? WHERE productCode = ?',
					[quantityOrdered, product.productCode]
				);
			}

			await connection.commit();

			return json({ 
				success: true, 
				data: { orderNumber: newOrderNumber },
				message: 'Order created successfully'
			}, { status: 201 });
		} catch (err) {
			await connection.rollback();
			throw err;
		}
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to create order' }, { status: 500 });
	}
};
