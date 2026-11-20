const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios.routes');
const connectDB = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/usuarios', usuariosRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en el puerto ${PORT}`);
        });
    } catch (error) {
        process.exit(1);
    }
}

startServer();