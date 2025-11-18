import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
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
			SELECT COUNT(*) as total 
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

		const [rows] = await connection.query(query);
		const total = Array.isArray(rows) ? (rows[0] as { total: number }).total : 0;

		return json({ total });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to count orders' }, { status: 500 });
	}
};
