import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const customerName = url.searchParams.get('customerName');

        let countQuery = 'SELECT COUNT(*) as total FROM customers';
        const params = [];

        if (customerName) {
            countQuery += ' WHERE customerName LIKE ?';
            params.push(`%${customerName}%`);
        }

        const [countResult] = await connection.query(countQuery, params) as [Array<{ total: number }>, unknown];
        const total = countResult[0].total;

        return json({ total });
    } catch (err) {
        console.error(err);
        return json({ error: 'Failed to count customers' }, { status: 500 });
    }
};
