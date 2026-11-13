const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');
const pool = require('./db');

const app = express();
app.use(express.json());

app.use('/usuarios', usuariosRoutes);

const PORT = 3000;

async function startServer() {
    try {
        await pool.query('SELECT 1');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to PostgreSQL:', error);
        process.exitCode = 1;
        await pool.end();
    }
}

startServer();