import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const limit = url.searchParams.get('limit') || '50';
        const offset = url.searchParams.get('offset') || '0';
        const sortBy = url.searchParams.get('sortBy') || 'customerName';
        const sortOrder = url.searchParams.get('sortOrder') || 'asc';
        
        const filterableColumns = ['customerNumber', 'customerName', 'contactFirstName', 'contactLastName', 'phone', 'city', 'state', 'country'];
        
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

        let query = 'SELECT * FROM customers';

        if (filterColumn && filterValue) {
            query += ` WHERE ${filterColumn} LIKE '%${filterValue}%'`;
        }
        
        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await connection.query(query);

        return json({ data: rows });
    } catch (err) {
        console.error(err);
        return json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.customerNumber) {
			const [rows] = await connection.query(
				'SELECT MAX(customerNumber) as maxNumber FROM customers'
			);
			const maxNumber = (rows as Array<{ maxNumber: number | null }>)[0]?.maxNumber || 0;
			body.customerNumber = maxNumber + 1;
		}

		const [result] = await connection.query('INSERT INTO customers SET ?', [body]);

		return json({ data: result }, { status: 201 });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to create customer' }, { status: 500 });
	}
};
