// src/controllers/usuarios.controller.js
// Controlador de usuarios respaldado en MongoDB (Mongoose).
// Sesión 1 (Integrante 2): registro y consulta.
// Actualizar y eliminar quedan para el Integrante 5 (CRUD completo).

const mongoose = require('mongoose');
const User = require('../models/User');

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
        const { nombre, correo, email, edad } = req.body || {};

        // Se construye el documento solo con los campos permitidos
        // (evita que el cliente inyecte campos como password o _id).
        const datos = { nombre, correo: correo !== undefined ? correo : email };
        if (edad !== undefined && edad !== null && edad !== '') {
            datos.edad = edad;
        }

        // Los tipos inválidos (objetos, arreglos) no se castean a string en silencio
        for (const campo of ['nombre', 'correo']) {
            if (datos[campo] !== undefined && typeof datos[campo] !== 'string') {
                return res.status(400).json({ error: `El campo "${campo}" debe ser un texto` });
            }
        }

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
 * Pendiente: lo completa el Integrante 5 (CRUD completo).
 */
const actualizarUsuario = async (req, res) => {
    return res.status(501).json({ error: 'Actualizar usuario aún no está implementado' });
};

/**
 * DELETE /usuarios/:id
 * Pendiente: lo completa el Integrante 5 (CRUD completo).
 */
const eliminarUsuario = async (req, res) => {
    return res.status(501).json({ error: 'Eliminar usuario aún no está implementado' });
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
