import mysql from 'mysql2/promise';

export const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  database: 'classicmodels',
  password: '6547'
});