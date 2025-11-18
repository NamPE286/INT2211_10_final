import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = url.searchParams.get('limit') || '50';
		const offset = url.searchParams.get('offset') || '0';
		const sortBy = url.searchParams.get('sortBy') || 'lastName';
		const sortOrder = url.searchParams.get('sortOrder') || 'asc';
		const search = url.searchParams.get('search');

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
            SELECT 
                e.*,
                o.city,
                o.phone,
                o.addressLine1,
                o.addressLine2,
                o.state,
                o.country,
                o.postalCode,
                o.territory,
                CONCAT(m.firstName, ' ', m.lastName) as managerName
            FROM employees e
            LEFT JOIN offices o ON e.officeCode = o.officeCode
            LEFT JOIN employees m ON e.reportsTo = m.employeeNumber
        `;

		if (search) {
			query += ` WHERE CONCAT(e.firstName, ' ', e.lastName) LIKE '%${search}%'`;
		} else if (filterColumn && filterValue) {
			if (filterColumn === 'city' || filterColumn === 'country') {
				query += ` WHERE o.${filterColumn} LIKE '%${filterValue}%'`;
			} else if (filterColumn === 'fullName') {
				query += ` WHERE CONCAT(e.firstName, ' ', e.lastName) LIKE '%${filterValue}%'`;
			} else {
				query += ` WHERE e.${filterColumn} LIKE '%${filterValue}%'`;
			}
		}

		query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

		const [rows] = await connection.query(query);

		return json({ data: rows });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch employees' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.employeeNumber) {
			const [rows] = await connection.query(
				'SELECT MAX(employeeNumber) as maxNumber FROM employees'
			);
			const maxNumber = (rows as Array<{ maxNumber: number | null }>)[0]?.maxNumber || 0;
			body.employeeNumber = maxNumber + 1;
		}

		const {
			city,
			phone,
			addressLine1,
			addressLine2,
			state,
			country,
			postalCode,
			territory,
			managerName,
			...employeeData
		} = body;

		const [result] = await connection.query('INSERT INTO employees SET ?', [employeeData]);

		return json({ data: result }, { status: 201 });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to create employee' }, { status: 500 });
	}
};
