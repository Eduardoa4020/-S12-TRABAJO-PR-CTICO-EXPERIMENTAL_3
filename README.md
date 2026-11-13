# API de Usuarios

API REST básica para usuarios, desarrollada con Node.js y Express. Las rutas implementadas son provisionales: solo devuelven mensajes de texto e **no realizan operaciones reales en una base de datos**.

## Tecnologías

- Node.js
- Express

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start
```

El servidor se ejecuta en `http://localhost:3000`.

## Endpoints

- `POST /usuarios` — Registrar usuario.
- `GET /usuarios` — Consultar usuarios.
- `GET /usuarios/:id` — Consultar usuario por ID.
- `PUT /usuarios/:id` — Actualizar usuario.
- `DELETE /usuarios/:id` — Eliminar usuario.

Por ahora, los endpoints solo responden con mensajes de texto; no persisten ni modifican datos.

## Licencia

ISC