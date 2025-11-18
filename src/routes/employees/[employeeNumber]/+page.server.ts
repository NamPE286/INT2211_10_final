import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Employee } from '$lib/types/employee';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [rows] = await connection.query(
			`SELECT 
				e.*,
				o.city,
				o.phone,
				o.addressLine1,
				o.addressLine2,
				o.state,
				o.country,
				o.postalCode,
				o.territory,
				CONCAT(m.firstName, ' ', m.lastName) as managerName
			FROM employees e
			LEFT JOIN offices o ON e.officeCode = o.officeCode
			LEFT JOIN employees m ON e.reportsTo = m.employeeNumber
			WHERE e.employeeNumber = ?`,
			[params.employeeNumber]
		);

		if (!Array.isArray(rows) || rows.length === 0) {
			throw error(404, 'Employee not found');
		}

		return {
			employee: rows[0] as Employee
		};
	} catch (err) {
		console.error('Failed to fetch employee:', err);
		throw error(500, 'Failed to fetch employee details');
	}
};
