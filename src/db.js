require('dotenv').config({ quiet: true });

const { Pool } = require('pg');

const missingVariables = ['DB_USER', 'DB_PASSWORD'].filter(
    (name) => process.env[name] === undefined
);

if (missingVariables.length > 0) {
    throw new Error(`Missing database configuration: ${missingVariables.join(', ')}. Set them in .env.`);
}

const port = Number(process.env.DB_PORT || 5432);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535.');
}

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port,
    database: process.env.DB_NAME || 'api_usuarios',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

module.exports = pool;
