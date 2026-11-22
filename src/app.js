const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    return next(err);
});

module.exports = app;
