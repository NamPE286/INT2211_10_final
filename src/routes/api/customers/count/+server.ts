import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const filterableColumns = ['customerName', 'contactFirstName', 'contactLastName', 'phone', 'city', 'state', 'country'];
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

        let countQuery = 'SELECT COUNT(*) as total FROM customers';
        const params = [];

        if (filterColumn && filterValue) {
            countQuery += ` WHERE ${filterColumn} LIKE ?`;
            params.push(`%${filterValue}%`);
        }

        const [countResult] = await connection.query(countQuery, params) as [Array<{ total: number }>, unknown];
        const total = countResult[0].total;

        return json({ total });
    } catch (err) {
        console.error(err);
        return json({ error: 'Failed to count customers' }, { status: 500 });
    }
};
