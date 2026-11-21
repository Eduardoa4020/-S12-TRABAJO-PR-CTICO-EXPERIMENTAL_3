// src/routes/auth.routes.js
// Rutas de autenticación y funcionalidades protegidas con JWT (Sesión 2 - Integrante 3).

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const usuariosController = require('../controllers/usuarios.controller');
const { verificarToken, requerirRol } = require('../middlewares/auth.middleware');

// POST /auth/register -> Alias de registro con hash de contraseña
router.post('/register', usuariosController.crearUsuario);

// POST /auth/login -> Autenticación y emisión del token JWT
router.post('/login', authController.login);

// GET /auth/perfil -> Ruta protegida (401 si no hay token válido)
router.get('/perfil', verificarToken, authController.obtenerPerfil);

// GET /auth/admin -> Ruta protegida por rol (401 sin token, 403 si no es admin)
router.get('/admin', verificarToken, requerirRol('admin'), authController.panelAdmin);

module.exports = router;
