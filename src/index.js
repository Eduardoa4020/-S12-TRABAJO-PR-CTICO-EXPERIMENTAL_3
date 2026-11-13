const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();
app.use(express.json());

app.use('/usuarios', usuariosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});