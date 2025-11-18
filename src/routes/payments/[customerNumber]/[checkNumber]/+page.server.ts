import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Payment } from '$lib/types/customer';

export const load: PageServerLoad = async ({ params }) => {
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
			throw error(404, 'Payment not found');
		}

		return {
			payment: rows[0] as Payment & {
				customerName: string;
				contactFirstName: string;
				contactLastName: string;
				phone: string;
				addressLine1: string;
				addressLine2: string | null;
				city: string;
				state: string | null;
				postalCode: string;
				country: string;
			}
		};
	} catch (err) {
		console.error('Failed to fetch payment:', err);
		throw error(500, 'Failed to fetch payment details');
	}
};
