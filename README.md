# API de Usuarios

API REST base para la configuración inicial del backend de la Práctica 4 universitaria Full Stack de gestión de usuarios. El backend está desarrollado con Node.js y Express y se prepara para integrarse con MongoDB y autenticación JWT desde React.

Esta es la configuración inicial entregada para continuar el trabajo con el equipo. Los usuarios se guardan en MongoDB mediante Mongoose (Sesión 1: base de datos y modelo de usuario). Actualizar y eliminar se completan en la sesión del CRUD completo.

## Tecnologías utilizadas

- React
- Node.js
- Express
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)

## Funcionalidades

### Implementadas

- Configuración inicial del servidor Express.
- Conexión configurable a MongoDB mediante Mongoose.
- Modelo de usuario con Mongoose (`src/models/User.js`): nombre, correo único, edad, fechas de creación/actualización.
- Registro (`POST /usuarios`) y consulta (`GET /usuarios`, `GET /usuarios/:id`) respaldados en MongoDB, con validaciones y códigos 400/404/409.
- Configuración de CORS y variables de entorno.

### Planificadas

- CRUD completo de usuarios con persistencia en MongoDB.
- Registro e inicio de sesión de usuarios.
- Cifrado de contraseñas con bcrypt.
- Generación y validación de tokens JWT.
- Protección de rutas privadas mediante middleware de autenticación.

## Instalación

Instala las dependencias:

```bash
npm install
```

Crea el archivo de entorno a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

Configura las variables necesarias en `.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/practica4_db
JWT_SECRET=tu_clave_secreta_aqui
```

## Ejecución

Inicia el servidor:

```bash
npm start
```

La API estará disponible en `http://localhost:3000`. Al iniciar, el servidor se conectará a MongoDB antes de comenzar a escuchar solicitudes.

## Base de datos

Puedes usar MongoDB local (`mongodb://localhost:27017/practica4_db`) o MongoDB Atlas (cadena `mongodb+srv://...` en `MONGO_URI`; recuerda permitir tu IP en *Network Access*). La colección se llama `usuarios` y el índice único de `correo` se crea al iniciar el servidor.

## Modelo de usuario

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | String | obligatorio, máx. 100 caracteres |
| `correo` | String | obligatorio, único, en minúsculas, formato válido, máx. 254 |
| `edad` | Number | opcional, entero ≥ 0 |
| `password` | String | reservado para JWT (no se devuelve en las consultas) |
| `creado_en` / `actualizado_en` | Date | automáticos |

## Endpoints

- `POST /usuarios` — Registrar usuario (`201`; `400` validación; `409` correo repetido).
- `GET /usuarios` — Consultar usuarios (`200`).
- `GET /usuarios/:id` — Consultar usuario por ID (`200`; `400` ID inválido; `404` no existe).
- `PUT /usuarios/:id` — Actualizar usuario (pendiente, responde `501`).
- `DELETE /usuarios/:id` — Eliminar usuario (pendiente, responde `501`).

Ejemplo de registro:

```json
POST /usuarios
{ "nombre": "Erick Minda", "correo": "erick@example.com", "edad": 22 }
```