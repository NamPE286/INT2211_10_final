import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Customer } from '$lib/types/customer';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [rows] = await connection.query('SELECT * FROM customers WHERE customerNumber = ?', [
			params.customerNumber
		]);

		if (!Array.isArray(rows) || rows.length === 0) {
			throw error(404, 'Customer not found');
		}

		return {
			customer: rows[0] as Customer
		};
	} catch (err) {
		console.error('Failed to fetch customer:', err);
		throw error(500, 'Failed to fetch customer details');
	}
};
