import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = url.searchParams.get('limit') || '50';
		const offset = url.searchParams.get('offset') || '0';

		const [rows] = await connection.query('SELECT * FROM customers LIMIT ? OFFSET ?', [
			parseInt(limit),
			parseInt(offset)
		]);

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
