import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const [rows] = await connection.query('SELECT productLine FROM productlines ORDER BY productLine');
		
		const productLines = Array.isArray(rows) ? rows.map((row: any) => row.productLine) : [];

		return json({ data: productLines });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch product lines' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { productLine, textDescription, htmlDescription, image } = data;

		if (!productLine) {
			return json({ error: 'Product line name is required' }, { status: 400 });
		}

		const query = `
			INSERT INTO productlines (productLine, textDescription, htmlDescription, image)
			VALUES (?, ?, ?, ?)
		`;

		await connection.query(query, [
			productLine,
			textDescription || null,
			htmlDescription || null,
			image || null
		]);

		return json({ 
			data: { productLine },
			message: 'Product line created successfully' 
		}, { status: 201 });
	} catch (err: any) {
		console.error(err);
		if (err.code === 'ER_DUP_ENTRY') {
			return json({ error: 'Product line already exists' }, { status: 409 });
		}
		return json({ error: 'Failed to create product line' }, { status: 500 });
	}
};
