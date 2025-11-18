import { connection } from '$lib/db/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        // Get total customers
        const [customersResult] = await connection.query(
            'SELECT COUNT(*) as count FROM customers'
        );
        const totalCustomers = (customersResult as Array<{ count: number }>)[0].count;

        // Get total employees
        const [employeesResult] = await connection.query(
            'SELECT COUNT(*) as count FROM employees'
        );
        const totalEmployees = (employeesResult as Array<{ count: number }>)[0].count;

        // Get total offices
        const [officesResult] = await connection.query(
            'SELECT COUNT(*) as count FROM offices'
        );
        const totalOffices = (officesResult as Array<{ count: number }>)[0].count;

        // Get total orders
        const [ordersResult] = await connection.query(
            'SELECT COUNT(*) as count FROM orders'
        );
        const totalOrders = (ordersResult as Array<{ count: number }>)[0].count;

        // Get total products
        const [productsResult] = await connection.query(
            'SELECT COUNT(*) as count FROM products'
        );
        const totalProducts = (productsResult as Array<{ count: number }>)[0].count;

        // Get total payments and revenue
        const [paymentsResult] = await connection.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalRevenue FROM payments'
        );
        const totalPayments = (paymentsResult as Array<{ count: number; totalRevenue: number }>)[0].count;
        const totalRevenue = (paymentsResult as Array<{ count: number; totalRevenue: number }>)[0].totalRevenue;

        // Get pending orders (status = 'In Process' or 'On Hold')
        const [pendingOrdersResult] = await connection.query(
            "SELECT COUNT(*) as count FROM orders WHERE status IN ('In Process', 'On Hold')"
        );
        const pendingOrders = (pendingOrdersResult as Array<{ count: number }>)[0].count;

        // Get shipped orders
        const [shippedOrdersResult] = await connection.query(
            "SELECT COUNT(*) as count FROM orders WHERE status = 'Shipped'"
        );
        const shippedOrders = (shippedOrdersResult as Array<{ count: number }>)[0].count;

        // Get low stock products (less than 100 items)
        const [lowStockResult] = await connection.query(
            'SELECT COUNT(*) as count FROM products WHERE quantityInStock < 100'
        );
        const lowStockProducts = (lowStockResult as Array<{ count: number }>)[0].count;

        const dashboardData = {
            totalCustomers,
            totalEmployees,
            totalOffices,
            totalOrders,
            totalProducts,
            totalPayments,
            totalRevenue,
            pendingOrders,
            shippedOrders,
            lowStockProducts
        };

        return json({ data: dashboardData });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        return json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
    }
};
