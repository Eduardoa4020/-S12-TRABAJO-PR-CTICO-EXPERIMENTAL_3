const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verificarToken, verificarPropietarioOAdmin } = require('../middlewares/auth.middleware');

// Registro público de usuario (con hash de contraseña bcrypt)
router.post('/', usuariosController.crearUsuario);

// Rutas protegidas con JWT (401 si no envía token válido)
router.get('/', verificarToken, usuariosController.obtenerUsuarios);

// Rutas protegidas con JWT + validación de propietario o rol admin (401 / 403)
router.get('/:id', verificarToken, verificarPropietarioOAdmin, usuariosController.obtenerUsuarioPorId);
router.put('/:id', verificarToken, verificarPropietarioOAdmin, usuariosController.actualizarUsuario);
router.delete('/:id', verificarToken, verificarPropietarioOAdmin, usuariosController.eliminarUsuario);

module.exports = router;
