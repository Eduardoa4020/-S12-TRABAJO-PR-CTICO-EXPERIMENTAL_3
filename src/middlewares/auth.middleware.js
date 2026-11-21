// src/middlewares/auth.middleware.js
// Middlewares de autenticación y autorización con JWT (Sesión 2 - Integrante 3).

const jwt = require('jsonwebtoken');

/**
 * Middleware 401: Verifica que la petición incluya un token JWT válido en
 * el encabezado "Authorization: Bearer <token>".
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
        return res.status(401).json({
            error: 'Acceso no autorizado: token no proporcionado'
        });
    }

    const partes = authHeader.trim().split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
        return res.status(401).json({
            error: 'Acceso no autorizado: el formato del encabezado debe ser "Bearer <token>"'
        });
    }

    const token = partes[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            error: 'Error de configuración: JWT_SECRET no está definida en el servidor'
        });
    }

    try {
        const payload = jwt.verify(token, secret);
        req.usuario = payload;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Acceso no autorizado: el token ha expirado'
            });
        }
        return res.status(401).json({
            error: 'Acceso no autorizado: token inválido'
        });
    }
};

/**
 * Middleware 403: Verifica que el usuario autenticado tenga uno de los roles permitidos.
 */
const requerirRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Acceso no autorizado: usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: 'Acceso prohibido: no tienes permisos suficientes para realizar esta acción'
            });
        }

        return next();
    };
};

/**
 * Middleware 403: Permite el acceso solo si el usuario autenticado es el dueño
 * del recurso (:id) o si tiene rol "admin".
 */
const verificarPropietarioOAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            error: 'Acceso no autorizado: usuario no autenticado'
        });
    }

    const { id } = req.params;
    const esPropietario = String(req.usuario.id) === String(id);
    const esAdmin = req.usuario.rol === 'admin';

    if (!esPropietario && !esAdmin) {
        return res.status(403).json({
            error: 'Acceso prohibido: no tienes permisos para acceder o modificar la cuenta de otro usuario'
        });
    }

    return next();
};

module.exports = {
    verificarToken,
    requerirRol,
    verificarPropietarioOAdmin
};
