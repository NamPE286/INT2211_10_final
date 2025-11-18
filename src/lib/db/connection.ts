import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

export const connection = await mysql.createConnection({
	host: env.MYSQL_HOST,
	port: parseInt(env.MYSQL_PORT),
	user: env.MYSQL_USER,
	database: env.MYSQL_DATABASE,
	password: env.MYSQL_PASSWORD
});
