import { connection } from '$lib/db/connection';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Office, Employee } from '$lib/types/employee';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [officeRows] = await connection.query(
			'SELECT * FROM offices WHERE officeCode = ?',
			[params.officeCode]
		);

		if (!Array.isArray(officeRows) || officeRows.length === 0) {
			throw error(404, 'Office not found');
		}

		// Get employees in this office
		const [employeeRows] = await connection.query(
			`SELECT 
				e.employeeNumber,
				e.lastName,
				e.firstName,
				e.email,
				e.jobTitle,
				e.extension,
				CONCAT(m.firstName, ' ', m.lastName) as managerName
			FROM employees e
			LEFT JOIN employees m ON e.reportsTo = m.employeeNumber
			WHERE e.officeCode = ?
			ORDER BY e.lastName, e.firstName`,
			[params.officeCode]
		);

		return {
			office: officeRows[0] as Office,
			employees: employeeRows as Employee[]
		};
	} catch (err) {
		console.error('Failed to fetch office:', err);
		throw error(500, 'Failed to fetch office details');
	}
};
