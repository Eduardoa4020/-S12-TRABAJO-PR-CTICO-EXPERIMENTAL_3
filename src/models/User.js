// src/models/User.js
// Modelo de usuario (colección "usuarios" en MongoDB) definido con Mongoose.

const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El campo "nombre" es obligatorio'],
            trim: true,
            maxlength: [100, 'El campo "nombre" no puede superar los 100 caracteres']
        },
        correo: {
            type: String,
            required: [true, 'El campo "correo" es obligatorio'],
            trim: true,
            lowercase: true,
            unique: true,
            maxlength: [254, 'El campo "correo" no puede superar los 254 caracteres'],
            match: [EMAIL_REGEX, 'El campo "correo" no tiene un formato válido']
        },
        edad: {
            type: Number,
            cast: 'El campo "edad" debe ser un número entero mayor o igual a 0',
            min: [0, 'El campo "edad" debe ser un número entero mayor o igual a 0'],
            validate: {
                validator: Number.isInteger,
                message: 'El campo "edad" debe ser un número entero mayor o igual a 0'
            }
        },
        // Campo reservado para la autenticación JWT (Integrante 3).
        // "select: false" evita que el hash se devuelva en las consultas.
        // Aún no es obligatorio: el hash con bcrypt y el login se agregan en la Sesión 2.
        password: {
            type: String,
            select: false
        }
    },
    {
        collection: 'usuarios',
        timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' },
        versionKey: false,
        toJSON: {
            // Expone "id" en lugar de "_id" y nunca incluye el password.
            transform: (_doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.password;
                return ret;
            }
        }
    }
);

module.exports = mongoose.model('User', userSchema);
