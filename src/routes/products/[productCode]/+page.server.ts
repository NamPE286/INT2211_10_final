import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type Product = {
	productCode: string;
	productName: string;
	productLine: string;
	productScale: string;
	productVendor: string;
	productDescription: string;
	quantityInStock: number;
	buyPrice: string;
	MSRP: string;
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [productRows] = await connection.query(
			'SELECT * FROM products WHERE productCode = ?',
			[params.productCode]
		);

		if (!Array.isArray(productRows) || productRows.length === 0) {
			throw error(404, 'Product not found');
		}

		return {
			product: productRows[0] as Product
		};
	} catch (err) {
		console.error('Failed to fetch product:', err);
		throw error(500, 'Failed to fetch product details');
	}
};
