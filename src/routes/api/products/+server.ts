import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = url.searchParams.get('limit') || '50';
		const offset = url.searchParams.get('offset') || '0';
		const sortBy = url.searchParams.get('sortBy') || 'productName';
		const sortOrder = url.searchParams.get('sortOrder') || 'asc';

		const filterableColumns = [
			'productCode',
			'productName',
			'productLine',
			'productVendor',
			'productScale'
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

		let query = 'SELECT * FROM products';

		if (filterColumn && filterValue) {
			query += ` WHERE ${filterColumn} LIKE '%${filterValue}%'`;
		}

		query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

		const [rows] = await connection.query(query);

		return json({ data: rows });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch products' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const {
			productCode,
			productName,
			productLine,
			productScale,
			productVendor,
			productDescription,
			quantityInStock,
			buyPrice,
			MSRP
		} = data;

		if (!productCode || !productName || !productLine || !productScale || !productVendor || !productDescription) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const query = `
			INSERT INTO products (
				productCode, productName, productLine, productScale, productVendor,
				productDescription, quantityInStock, buyPrice, MSRP
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const [result] = await connection.query(query, [
			productCode,
			productName,
			productLine,
			productScale,
			productVendor,
			productDescription,
			quantityInStock || 0,
			buyPrice || '0.00',
			MSRP || '0.00'
		]);

		return json({ data: { productCode, ...data }, message: 'Product created successfully' }, { status: 201 });
	} catch (err: any) {
		console.error(err);
		if (err.code === 'ER_DUP_ENTRY') {
			return json({ error: 'Product code already exists' }, { status: 409 });
		}
		return json({ error: 'Failed to create product' }, { status: 500 });
	}
};
