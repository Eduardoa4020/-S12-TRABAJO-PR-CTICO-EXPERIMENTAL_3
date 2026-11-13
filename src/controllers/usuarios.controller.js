// src/controllers/usuarios.controller.js

let pool = null;
try {
    pool = require('../db');
} catch (error) {
    // Si no está configurado .env o db.js falla, pool queda como null
    pool = null;
}

// Almacenamiento en memoria como respaldo / pruebas independientes
let usuariosMemoria = [
    { id: 1, nombre: 'Juan Pérez', correo: 'juan.perez@example.com', edad: 28, creado_en: new Date().toISOString() },
    { id: 2, nombre: 'Ana Gómez', correo: 'ana.gomez@example.com', edad: 34, creado_en: new Date().toISOString() }
];
let siguienteId = 3;

/**
 * GET /usuarios
 * Consultar todos los usuarios
 */
const obtenerUsuarios = async (req, res) => {
    try {
        if (pool && typeof pool.query === 'function') {
            const result = await pool.query(
                'SELECT id, nombre, correo, edad, creado_en FROM usuarios ORDER BY id ASC'
            );
            return res.status(200).json({
                mensaje: 'Usuarios obtenidos con éxito',
                total: result.rows.length,
                datos: result.rows
            });
        }

        return res.status(200).json({
            mensaje: 'Usuarios obtenidos con éxito (en memoria)',
            total: usuariosMemoria.length,
            datos: usuariosMemoria
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al consultar usuarios',
            detalle: error.message
        });
    }
};

/**
 * GET /usuarios/:id
 * Consultar un usuario por ID
 */
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID proporcionado debe ser un número entero positivo' });
        }

        if (pool && typeof pool.query === 'function') {
            const result = await pool.query(
                'SELECT id, nombre, correo, edad, creado_en FROM usuarios WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: `Usuario con ID ${id} no encontrado` });
            }

            return res.status(200).json({
                mensaje: 'Usuario encontrado con éxito',
                datos: result.rows[0]
            });
        }

        const usuario = usuariosMemoria.find((u) => u.id === id);
        if (!usuario) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado` });
        }

        return res.status(200).json({
            mensaje: 'Usuario encontrado con éxito (en memoria)',
            datos: usuario
        });
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al consultar el usuario',
            detalle: error.message
        });
    }
};

/**
 * POST /usuarios
 * Registrar un nuevo usuario
 */
const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, email, edad } = req.body;
        const correoFinal = (correo || email || '').trim();
        const nombreFinal = (nombre || '').trim();

        // Validaciones obligatorias
        if (!nombreFinal) {
            return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
        }

        if (nombreFinal.length > 100) {
            return res.status(400).json({ error: 'El campo "nombre" no puede superar los 100 caracteres' });
        }

        if (!correoFinal) {
            return res.status(400).json({ error: 'El campo "correo" es obligatorio' });
        }

        if (correoFinal.length > 254) {
            return res.status(400).json({ error: 'El campo "correo" no puede superar los 254 caracteres' });
        }

        // Validación de edad si es proporcionada
        let edadFinal = null;
        if (edad !== undefined && edad !== null && edad !== '') {
            edadFinal = Number(edad);
            if (!Number.isInteger(edadFinal) || edadFinal < 0) {
                return res.status(400).json({ error: 'El campo "edad" debe ser un número entero mayor o igual a 0' });
            }
        }

        if (pool && typeof pool.query === 'function') {
            try {
                const query = `
                    INSERT INTO usuarios (nombre, correo, edad)
                    VALUES ($1, $2, $3)
                    RETURNING id, nombre, correo, edad, creado_en
                `;
                const result = await pool.query(query, [nombreFinal, correoFinal, edadFinal]);
                return res.status(201).json({
                    mensaje: 'Usuario registrado con éxito',
                    datos: result.rows[0]
                });
            } catch (dbError) {
                // Código 23505 = unique_violation en PostgreSQL
                if (dbError.code === '23505') {
                    return res.status(409).json({ error: `El correo "${correoFinal}" ya está registrado` });
                }
                throw dbError;
            }
        }

        // Modo en memoria
        const existeCorreo = usuariosMemoria.some((u) => u.correo.toLowerCase() === correoFinal.toLowerCase());
        if (existeCorreo) {
            return res.status(409).json({ error: `El correo "${correoFinal}" ya está registrado` });
        }

        const nuevoUsuario = {
            id: siguienteId++,
            nombre: nombreFinal,
            correo: correoFinal,
            edad: edadFinal,
            creado_en: new Date().toISOString()
        };
        usuariosMemoria.push(nuevoUsuario);

        return res.status(201).json({
            mensaje: 'Usuario registrado con éxito (en memoria)',
            datos: nuevoUsuario
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al registrar el usuario',
            detalle: error.message
        });
    }
};

/**
 * PUT /usuarios/:id
 * Actualizar usuario por ID
 */
const actualizarUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID proporcionado debe ser un número entero positivo' });
        }

        const { nombre, correo, email, edad } = req.body;
        const correoEntrada = correo !== undefined ? correo : email;

        if (nombre === undefined && correoEntrada === undefined && edad === undefined) {
            return res.status(400).json({
                error: 'Debe proporcionar al menos un campo a actualizar ("nombre", "correo" o "edad")'
            });
        }

        const nombreFinal = nombre !== undefined ? String(nombre).trim() : null;
        if (nombreFinal !== null && nombreFinal.length > 100) {
            return res.status(400).json({ error: 'El campo "nombre" no puede superar los 100 caracteres' });
        }

        const correoFinal = correoEntrada !== undefined ? String(correoEntrada).trim() : null;
        if (correoFinal !== null && correoFinal.length > 254) {
            return res.status(400).json({ error: 'El campo "correo" no puede superar los 254 caracteres' });
        }

        let edadFinal = null;
        if (edad !== undefined) {
            if (edad === null || edad === '') {
                edadFinal = null;
            } else {
                edadFinal = Number(edad);
                if (!Number.isInteger(edadFinal) || edadFinal < 0) {
                    return res.status(400).json({ error: 'El campo "edad" debe ser un número entero mayor o igual a 0' });
                }
            }
        }

        if (pool && typeof pool.query === 'function') {
            try {
                const query = `
                    UPDATE usuarios
                    SET 
                        nombre = COALESCE($1, nombre),
                        correo = COALESCE($2, correo),
                        edad = CASE WHEN $3::boolean THEN $4 ELSE edad END
                    WHERE id = $5
                    RETURNING id, nombre, correo, edad, creado_en
                `;
                const updateEdad = edad !== undefined;
                const result = await pool.query(query, [nombreFinal, correoFinal, updateEdad, edadFinal, id]);

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: `Usuario con ID ${id} no encontrado para actualizar` });
                }

                return res.status(200).json({
                    mensaje: 'Usuario actualizado con éxito',
                    datos: result.rows[0]
                });
            } catch (dbError) {
                if (dbError.code === '23505') {
                    return res.status(409).json({ error: `El correo "${correoFinal}" ya está en uso por otro usuario` });
                }
                throw dbError;
            }
        }

        // Modo en memoria
        const index = usuariosMemoria.findIndex((u) => u.id === id);
        if (index === -1) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado para actualizar` });
        }

        if (correoFinal !== null) {
            const correoRepetido = usuariosMemoria.some(
                (u) => u.id !== id && u.correo.toLowerCase() === correoFinal.toLowerCase()
            );
            if (correoRepetido) {
                return res.status(409).json({ error: `El correo "${correoFinal}" ya está en uso por otro usuario` });
            }
            usuariosMemoria[index].correo = correoFinal;
        }

        if (nombreFinal !== null) {
            usuariosMemoria[index].nombre = nombreFinal;
        }

        if (edad !== undefined) {
            usuariosMemoria[index].edad = edadFinal;
        }

        return res.status(200).json({
            mensaje: 'Usuario actualizado con éxito (en memoria)',
            datos: usuariosMemoria[index]
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al actualizar el usuario',
            detalle: error.message
        });
    }
};

/**
 * DELETE /usuarios/:id
 * Eliminar un usuario por ID
 */
const eliminarUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID proporcionado debe ser un número entero positivo' });
        }

        if (pool && typeof pool.query === 'function') {
            const result = await pool.query(
                'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, correo, edad, creado_en',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: `Usuario con ID ${id} no encontrado para eliminar` });
            }

            return res.status(200).json({
                mensaje: 'Usuario eliminado con éxito',
                datos: result.rows[0]
            });
        }

        // Modo en memoria
        const index = usuariosMemoria.findIndex((u) => u.id === id);
        if (index === -1) {
            return res.status(404).json({ error: `Usuario con ID ${id} no encontrado para eliminar` });
        }

        const usuarioEliminado = usuariosMemoria.splice(index, 1)[0];
        return res.status(200).json({
            mensaje: 'Usuario eliminado con éxito (en memoria)',
            datos: usuarioEliminado
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({
            error: 'Error interno del servidor al eliminar el usuario',
            detalle: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
