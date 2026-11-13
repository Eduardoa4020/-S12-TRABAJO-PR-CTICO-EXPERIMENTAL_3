const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.send('Registrar usuario');
});

router.get('/', (req, res) => {
    res.send('Consultar usuarios');
});

router.get('/:id', (req, res) => {
    res.send(`Consultar usuario con ID: ${req.params.id}`);
});

router.put('/:id', (req, res) => {
    res.send(`Actualizar usuario con ID: ${req.params.id}`);
});

router.delete('/:id', (req, res) => {
    res.send(`Eliminar usuario con ID: ${req.params.id}`);
});

module.exports = router;