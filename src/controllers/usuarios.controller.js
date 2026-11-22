// src/controllers/usuarios.controller.js
// Controlador de usuarios respaldado en MongoDB (Mongoose).
// Sesión 1 (Integrante 2): registro y consulta.
// Sesión 2 (Integrante 3): hash de contraseñas con bcrypt en el registro.
// CRUD completo con validaciones y manejo de errores.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Convierte los errores de Mongoose/MongoDB en una respuesta HTTP coherente.
 */
const manejarError = (error, res, contexto) => {
    // Error de validación del esquema -> 400
    if (error instanceof mongoose.Error.ValidationError) {
        const errores = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ error: errores[0], errores });
    }

    // Índice único violado (correo repetido) -> 409
    if (error.code === 11000) {
        const correo = error.keyValue && error.keyValue.correo;
        return res.status(409).json({ error: `El correo "${correo}" ya está registrado` });
    }

    console.error(`Error al ${contexto}:`, error);
    return res.status(500).json({
        error: `Error interno del servidor al ${contexto}`,
        detalle: error.message
    });
};

/**
 * POST /usuarios
 * Registrar un nuevo usuario
 */
const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, email, edad, password, rol } = req.body || {};

        // Se construye el documento solo con los campos permitidos
        // (evita que el cliente inyecte campos como _id).
        const datos = { nombre, correo: correo !== undefined ? correo : email };
        if (edad !== undefined && edad !== null && edad !== '') {
            datos.edad = edad;
        }
        if (rol !== undefined) {
            datos.rol = rol;
        }

        // Los tipos inválidos (objetos, arreglos) no se castean a string en silencio
        for (const campo of ['nombre', 'correo', 'rol']) {
            if (datos[campo] !== undefined && typeof datos[campo] !== 'string') {
                return res.status(400).json({ error: `El campo "${campo}" debe ser un texto` });
            }
        }
        if (rol === 'admin') {
            return res.status(403).json({
                error: 'No se puede asignar el rol de administrador durante el registro'
            });
        }

        // Validación y hash de la contraseña (Integrante 3)
        if (password === undefined || password === null || password === '') {
            return res.status(400).json({ error: 'El campo "password" es obligatorio' });
        }
        if (typeof password !== 'string') {
            return res.status(400).json({ error: 'El campo "password" debe ser un texto' });
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                error: `El campo "password" debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
            });
        }

        datos.password = await bcrypt.hash(password, SALT_ROUNDS);

        const usuario = await User.create(datos);

        return res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            datos: usuario
        });
    } catch (error) {
        // "edad" no numérica llega como CastError dentro de un ValidationError
        return manejarError(error, res, 'registrar el usuario');
    }
};

/**
 * GET /usuarios
 * Consultar todos los usuarios
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find().sort({ creado_en: 1 });

        return res.status(200).json({
            mensaje: 'Usuarios obtenidos con éxito',
            total: usuarios.length,
            datos: usuarios
        });
    } catch (error) {
        return manejarError(error, res, 'consultar usuarios');
    }
};

/**
 * GET /usuarios/:id
 * Consultar un usuario por ID
 */
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'El ID proporcionado no es válido' });
        }

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado` });
        }

        return res.status(200).json({
            mensaje: 'Usuario encontrado con éxito',
            datos: usuario
        });
    } catch (error) {
        return manejarError(error, res, 'consultar el usuario');
    }
};

/**
 * PUT /usuarios/:id
 * Actualizar los campos permitidos de un usuario.
 */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'El ID proporcionado no es válido' });
        }

        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ error: 'El cuerpo de la petición debe ser un objeto JSON' });
        }

        const { nombre, correo, email, edad, password, rol, ...camposNoPermitidos } = req.body;
        if (Object.keys(camposNoPermitidos).length > 0) {
            return res.status(400).json({
                error: `Campo(s) no permitido(s): ${Object.keys(camposNoPermitidos).join(', ')}`
            });
        }

        const datos = {};
        for (const [campo, valor] of Object.entries({
            nombre,
            correo: correo !== undefined ? correo : email
        })) {
            if (valor !== undefined && typeof valor !== 'string') {
                return res.status(400).json({ error: `El campo "${campo}" debe ser un texto` });
            }
        }
        if (nombre !== undefined) datos.nombre = nombre;
        if (correo !== undefined || email !== undefined) {
            datos.correo = correo !== undefined ? correo : email;
        }
        if (edad !== undefined) datos.edad = edad === '' || edad === null ? undefined : edad;
        if (password !== undefined) {
            if (typeof password !== 'string') {
                return res.status(400).json({ error: 'El campo "password" debe ser un texto' });
            }
            if (password.length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({
                    error: `El campo "password" debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
                });
            }
            datos.password = await bcrypt.hash(password, SALT_ROUNDS);
        }
        if (rol !== undefined) {
            if (req.usuario.rol !== 'admin') {
                return res.status(403).json({
                    error: 'Acceso prohibido: solo un administrador puede cambiar el rol de un usuario'
                });
            }
            if (typeof rol !== 'string') {
                return res.status(400).json({ error: 'El campo "rol" debe ser un texto' });
            }
            datos.rol = rol;
        }
        if (Object.keys(datos).length === 0) {
            return res.status(400).json({ error: 'Debes proporcionar al menos un campo para actualizar' });
        }

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado` });
        }

        usuario.set(datos);
        await usuario.save();

        return res.status(200).json({
            mensaje: 'Usuario actualizado con éxito',
            datos: usuario
        });
    } catch (error) {
        return manejarError(error, res, 'actualizar el usuario');
    }
};

/**
 * DELETE /usuarios/:id
 * Eliminar un usuario.
 */
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'El ID proporcionado no es válido' });
        }

        const usuario = await User.findByIdAndDelete(id);
        if (!usuario) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado` });
        }

        return res.status(200).json({
            mensaje: 'Usuario eliminado con éxito',
            datos: usuario
        });
    } catch (error) {
        return manejarError(error, res, 'eliminar el usuario');
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
