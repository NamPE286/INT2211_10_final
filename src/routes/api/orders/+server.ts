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
