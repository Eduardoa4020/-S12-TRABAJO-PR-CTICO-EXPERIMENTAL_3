const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth.routes');
const connectDB = require('./db');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);

// Error por JSON mal formado en el cuerpo de la petición -> 400
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    return next(err);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        // Crea el índice único de "correo" antes de aceptar peticiones
        await User.init();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en el puerto ${PORT}`);
        });
    } catch (error) {
        process.exit(1);
    }
}

startServer();