// src/controllers/auth.controller.js
// Controlador de autenticación y rutas protegidas con JWT (Sesión 2 - Integrante 3).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /auth/login
 * Autentica al usuario con correo y contraseña y emite un JWT firmado.
 */
const login = async (req, res) => {
    try {
        const { correo, email, password } = req.body || {};
        const correoRaw = correo !== undefined ? correo : email;

        // Validaciones de entrada (400 Bad Request)
        if (correoRaw === undefined || correoRaw === null || correoRaw === '') {
            return res.status(400).json({ error: 'El campo "correo" es obligatorio' });
        }
        if (typeof correoRaw !== 'string') {
            return res.status(400).json({ error: 'El campo "correo" debe ser un texto' });
        }

        const correoNormalizado = correoRaw.trim().toLowerCase();
        if (!EMAIL_REGEX.test(correoNormalizado)) {
            return res.status(400).json({ error: 'El campo "correo" no tiene un formato válido' });
        }

        if (password === undefined || password === null || password === '') {
            return res.status(400).json({ error: 'El campo "password" es obligatorio' });
        }
        if (typeof password !== 'string') {
            return res.status(400).json({ error: 'El campo "password" debe ser un texto' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                error: 'Error de configuración: JWT_SECRET no está definida en el servidor'
            });
        }

        // Buscar usuario incluyendo explícitamente el hash de la contraseña
        const usuario = await User.findOne({ correo: correoNormalizado }).select('+password');
        if (!usuario || !usuario.password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordCoincide = await bcrypt.compare(password, usuario.password);
        if (!passwordCoincide) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
        const payload = {
            id: usuario._id.toString(),
            correo: usuario.correo,
            nombre: usuario.nombre,
            rol: usuario.rol || 'usuario'
        };

        const token = jwt.sign(payload, secret, { expiresIn });

        return res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            expira_en: expiresIn,
            datos: usuario.toJSON()
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al iniciar sesión',
            detalle: error.message
        });
    }
};

/**
 * GET /auth/perfil
 * Ruta protegida (requiere token JWT válido).
 * Devuelve la información actualizada del usuario autenticado desde la base de datos.
 */
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ error: 'El usuario asociado al token ya no existe' });
        }

        return res.status(200).json({
            mensaje: 'Perfil del usuario autenticado obtenido con éxito',
            datos: usuario
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al obtener el perfil',
            detalle: error.message
        });
    }
};

/**
 * GET /auth/admin
 * Ruta protegida por rol (requiere token JWT válido + rol "admin").
 * Demuestra el manejo de 401 (sin token / token inválido) y 403 (token válido sin rol admin).
 */
const panelAdmin = async (req, res) => {
    try {
        const totalUsuarios = await User.countDocuments();
        return res.status(200).json({
            mensaje: 'Acceso concedido al panel de administración',
            administrador: req.usuario.correo,
            estadisticas: {
                total_usuarios_registrados: totalUsuarios
            }
        });
    } catch (error) {
        console.error('Error en panel admin:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al consultar el panel de administración',
            detalle: error.message
        });
    }
};

module.exports = {
    login,
    obtenerPerfil,
    panelAdmin
};
