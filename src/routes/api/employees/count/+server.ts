import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const filterableColumns = [
			'employeeNumber',
			'fullName',
			'firstName',
			'lastName',
			'email',
			'jobTitle',
			'city',
			'country'
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
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN offices o ON e.officeCode = o.officeCode
        `;

		if (filterColumn && filterValue) {
			if (filterColumn === 'city' || filterColumn === 'country') {
				query += ` WHERE o.${filterColumn} LIKE '%${filterValue}%'`;
			} else if (filterColumn === 'fullName') {
				query += ` WHERE CONCAT(e.firstName, ' ', e.lastName) LIKE '%${filterValue}%'`;
			} else {
				query += ` WHERE e.${filterColumn} LIKE '%${filterValue}%'`;
			}
		}

		const [rows] = await connection.query(query);
		const count = (rows as Array<{ count: number }>)[0].count;

		return json({ count });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch employee count' }, { status: 500 });
	}
};
