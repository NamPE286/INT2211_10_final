import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [rows] = await connection.query('SELECT * FROM customers WHERE customerNumber = ?', [
			params.id
		]);

		if (Array.isArray(rows) && rows.length === 0) {
			return json({ success: false, error: 'Customer not found' }, { status: 404 });
		}

		return json({ success: true, data: Array.isArray(rows) ? rows[0] : rows });
	} catch (err) {
		console.error(err);
		return json({ success: false, error: 'Failed to fetch customer' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		const [result] = await connection.query('UPDATE customers SET ? WHERE customerNumber = ?', [
			body,
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update customer' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await connection.query('DELETE FROM payments WHERE customerNumber = ?', [params.id]);

		await connection.query(
			'DELETE FROM orderdetails WHERE orderNumber IN (SELECT orderNumber FROM orders WHERE customerNumber = ?)',
			[params.id]
		);

		await connection.query('DELETE FROM orders WHERE customerNumber = ?', [params.id]);

		const [result] = await connection.query('DELETE FROM customers WHERE customerNumber = ?', [
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to delete customer' }, { status: 500 });
	}
};
