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
        const sortableColumns = ['customerNumber', 'customerName', 'contactFirstName', 'contactLastName', 'phone', 'city', 'state', 'country', 'creditLimit'];
        
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
        const params = [];

        if (filterColumn && filterValue) {
            query += ` WHERE ${filterColumn} LIKE ?`;
            params.push(`%${filterValue}%`);
        }

        // Validate sortBy column to prevent SQL injection
        const validSortBy = sortableColumns.includes(sortBy) ? sortBy : 'customerName';
        const validSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await connection.query(query, params);

        return json({ data: rows });
    } catch (err) {
        console.error(err);
        return json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const [result] = await connection.query('INSERT INTO customers SET ?', [body]);

		return json({ data: result }, { status: 201 });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to create customer' }, { status: 500 });
	}
};
