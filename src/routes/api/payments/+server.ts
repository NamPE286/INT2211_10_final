import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = url.searchParams.get('limit') || '50';
		const offset = url.searchParams.get('offset') || '0';
		const sortBy = url.searchParams.get('sortBy') || 'paymentDate';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';

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

		let query = `
            SELECT 
                p.*,
                c.customerName
            FROM payments p
            LEFT JOIN customers c ON p.customerNumber = c.customerNumber
        `;

		if (filterColumn && filterValue) {
			if (filterColumn === 'customerName') {
				query += ` WHERE c.customerName LIKE '%${filterValue}%'`;
			} else {
				query += ` WHERE p.${filterColumn} LIKE '%${filterValue}%'`;
			}
		}

		query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

		const [rows] = await connection.query(query);

		return json({ data: rows });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch payments' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const [result] = await connection.query('INSERT INTO payments SET ?', [body]);

		return json({ data: result }, { status: 201 });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to create payment' }, { status: 500 });
	}
};
