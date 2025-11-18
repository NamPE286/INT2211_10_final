import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [rows] = await connection.query(
			`SELECT 
				p.*,
				c.customerName,
				c.contactFirstName,
				c.contactLastName,
				c.phone,
				c.addressLine1,
				c.addressLine2,
				c.city,
				c.state,
				c.postalCode,
				c.country
			FROM payments p
			LEFT JOIN customers c ON p.customerNumber = c.customerNumber
			WHERE p.customerNumber = ? AND p.checkNumber = ?`,
			[params.customerNumber, params.checkNumber]
		);

		if (!Array.isArray(rows) || rows.length === 0) {
			return json({ error: 'Payment not found' }, { status: 404 });
		}

		return json({ data: rows[0] });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch payment' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		await connection.query(
			'UPDATE payments SET ? WHERE customerNumber = ? AND checkNumber = ?',
			[body, params.customerNumber, params.checkNumber]
		);

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update payment' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await connection.query(
			'DELETE FROM payments WHERE customerNumber = ? AND checkNumber = ?',
			[params.customerNumber, params.checkNumber]
		);

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to delete payment' }, { status: 500 });
	}
};
