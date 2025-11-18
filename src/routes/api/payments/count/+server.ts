import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const filterableColumns = ['checkNumber', 'customerNumber', 'customerName'];

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

		let query = 'SELECT COUNT(*) as total FROM payments p';

		if (filterColumn && filterValue) {
			if (filterColumn === 'customerName') {
				query += ' LEFT JOIN customers c ON p.customerNumber = c.customerNumber';
				query += ` WHERE c.customerName LIKE '%${filterValue}%'`;
			} else {
				query += ` WHERE p.${filterColumn} LIKE '%${filterValue}%'`;
			}
		}

		const [rows] = await connection.query(query);
		const total = (rows as Array<{ total: number }>)[0]?.total || 0;

		return json({ total });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to count payments' }, { status: 500 });
	}
};
