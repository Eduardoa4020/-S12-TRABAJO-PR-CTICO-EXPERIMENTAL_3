require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI no está definida. Copia .env.example como .env y configura la variable.');
        }

        // Falla rápido (5 s) si Atlas/local no responde, en vez de esperar 30 s
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB conectado correctamente');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        throw error;
    }
};

module.exports = connectDB;
