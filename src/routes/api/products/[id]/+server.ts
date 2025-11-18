import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [rows] = await connection.query('SELECT * FROM products WHERE productCode = ?', [
			params.id
		]);

		if (Array.isArray(rows) && rows.length === 0) {
			return json({ success: false, error: 'Product not found' }, { status: 404 });
		}

		return json({ success: true, data: Array.isArray(rows) ? rows[0] : rows });
	} catch (err) {
		console.error(err);
		return json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		const [result] = await connection.query('UPDATE products SET ? WHERE productCode = ?', [
			body,
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update product' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await connection.query('DELETE FROM orderdetails WHERE productCode = ?', [params.id]);

		const [result] = await connection.query('DELETE FROM products WHERE productCode = ?', [
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to delete product' }, { status: 500 });
	}
};
