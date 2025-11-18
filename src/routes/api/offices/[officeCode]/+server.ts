import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [rows] = await connection.query(
			'SELECT * FROM offices WHERE officeCode = ?',
			[params.officeCode]
		);

		if (!Array.isArray(rows) || rows.length === 0) {
			return json({ error: 'Office not found' }, { status: 404 });
		}

		return json({ data: rows[0] });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to fetch office' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		await connection.query('UPDATE offices SET ? WHERE officeCode = ?', [
			body,
			params.officeCode
		]);

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update office' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		// Check if there are employees in this office
		const [employeeRows] = await connection.query(
			'SELECT COUNT(*) as count FROM employees WHERE officeCode = ?',
			[params.officeCode]
		);
		const employeeCount = (employeeRows as Array<{ count: number }>)[0]?.count || 0;

		if (employeeCount > 0) {
			return json(
				{ error: `Cannot delete office. ${employeeCount} employee(s) are assigned to this office.` },
				{ status: 400 }
			);
		}

		await connection.query('DELETE FROM offices WHERE officeCode = ?', [params.officeCode]);

		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to delete office' }, { status: 500 });
	}
};
