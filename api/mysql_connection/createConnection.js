const mysql = require('mysql2');

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	password: process.env.DB_PWD,
	namedPlaceholders: true,
});

module.exports = db;
