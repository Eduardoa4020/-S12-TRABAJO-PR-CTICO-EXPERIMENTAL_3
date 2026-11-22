const connectDB = require('./db');
const User = require('./models/User');
const app = require('./app');

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