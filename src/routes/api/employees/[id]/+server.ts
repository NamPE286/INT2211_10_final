import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
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
			[params.id]
		);

		const data = rows as Array<any>;

		if (data.length === 0) {
			return json({ error: 'Employee not found' }, { status: 404 });
		}

		return json({ data: data[0] });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch employee' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		const {
			city,
			phone,
			addressLine1,
			addressLine2,
			state,
			country,
			postalCode,
			territory,
			managerName,
			employeeNumber,
			...employeeData
		} = body;

		const [result] = await connection.query('UPDATE employees SET ? WHERE employeeNumber = ?', [
			employeeData,
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update employee' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, url }) => {
	try {
		const force = url.searchParams.get('force') === 'true';

		// Check if employee has direct reports
		const [reportersRows] = await connection.query(
			'SELECT COUNT(*) as count FROM employees WHERE reportsTo = ?',
			[params.id]
		);
		const reportersCount = (reportersRows as Array<{ count: number }>)[0]?.count || 0;

		// Check if employee is assigned to any customers
		const [customersRows] = await connection.query(
			'SELECT COUNT(*) as count FROM customers WHERE salesRepEmployeeNumber = ?',
			[params.id]
		);
		const customersCount = (customersRows as Array<{ count: number }>)[0]?.count || 0;

		if ((reportersCount > 0 || customersCount > 0) && !force) {
			const messages = [];
			if (reportersCount > 0) {
				messages.push(`${reportersCount} direct report${reportersCount > 1 ? 's' : ''}`);
			}
			if (customersCount > 0) {
				messages.push(`${customersCount} customer${customersCount > 1 ? 's' : ''}`);
			}

			return json(
				{
					error: 'Cannot delete employee',
					message: `This employee has ${messages.join(' and ')}. They will be left without a sales representative.`,
					hasReports: reportersCount > 0,
					hasCustomers: customersCount > 0,
					reportCount: reportersCount,
					customerCount: customersCount
				},
				{ status: 400 }
			);
		}

		// If force delete, update related records
		if (force) {
			if (reportersCount > 0) {
				await connection.query('UPDATE employees SET reportsTo = NULL WHERE reportsTo = ?', [
					params.id
				]);
			}
			if (customersCount > 0) {
				await connection.query(
					'UPDATE customers SET salesRepEmployeeNumber = NULL WHERE salesRepEmployeeNumber = ?',
					[params.id]
				);
			}
		}

		// Delete the employee
		const [result] = await connection.query('DELETE FROM employees WHERE employeeNumber = ?', [
			params.id
		]);

		return json({ data: result });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to delete employee' }, { status: 500 });
	}
};
