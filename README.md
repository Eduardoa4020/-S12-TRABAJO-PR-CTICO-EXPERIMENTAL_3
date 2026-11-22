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
- Modelo de usuario con Mongoose (`src/models/User.js`): nombre, correo único, edad, contraseña cifrada (`password`), rol (`usuario` / `admin`) y fechas de creación/actualización.
- Registro (`POST /usuarios` y `POST /auth/register`) con cifrado de contraseñas mediante `bcryptjs` (10 rondas de salt) y validaciones.
- Inicio de sesión (`POST /auth/login`) que verifica credenciales y emite un token JWT firmado.
- Middleware de verificación de token JWT (`verificarToken` -> `401 Unauthorized`) y autorización por rol/propietario (`requerirRol`, `verificarPropietarioOAdmin` -> `403 Forbidden`).
- Rutas protegidas (`GET /auth/perfil`, `GET /auth/admin`, `GET /usuarios`, `GET /usuarios/:id`) respaldadas en MongoDB con manejo de códigos `400`, `401`, `403`, `404` y `409`.
- Configuración de CORS y variables de entorno.

### Planificadas

- CRUD completo de usuarios (`PUT /usuarios/:id` y `DELETE /usuarios/:id`) con persistencia en MongoDB (Integrante 5).

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

## Aplicación React

El cliente React está en `frontend/` y consume esta API. Para ejecutar la aplicación completa, inicia primero MongoDB y el servidor en una terminal:

```bash
npm install
npm start
```

En otra terminal, instala y ejecuta el cliente:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Abre la dirección que muestra Vite (normalmente `http://localhost:5173`). El cliente usa `http://localhost:3000` por defecto. Para apuntarlo a otro servidor, copia `frontend/.env.example` a `frontend/.env` y configura `VITE_API_URL`.

El cliente permite crear una cuenta, iniciar sesión, conservar el JWT en el navegador, consultar el perfil y cargar el directorio desde rutas protegidas. Cerrar sesión elimina el token local. La edición y eliminación quedan pendientes de que el backend implemente esos endpoints.

## Base de datos

Puedes usar MongoDB local (`mongodb://localhost:27017/practica4_db`) o MongoDB Atlas (cadena `mongodb+srv://...` en `MONGO_URI`; recuerda permitir tu IP en *Network Access*). La colección se llama `usuarios` y el índice único de `correo` se crea al iniciar el servidor.

Para desarrollo local también puedes ejecutar MongoDB con Docker:

```powershell
docker run --name usuarios-mongodb --restart unless-stopped --publish 127.0.0.1:27017:27017 --volume usuarios_mongodb_data:/data/db --detach mongo:8
```

Configura `MONGO_URI=mongodb://127.0.0.1:27017/practica4_db` y una clave aleatoria propia en `JWT_SECRET` dentro de `.env`. El puerto queda publicado solo en localhost y los datos persisten en el volumen `usuarios_mongodb_data`. Para detener e iniciar la base, usa `docker stop usuarios-mongodb` y `docker start usuarios-mongodb`.

## Modelo de usuario

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | String | obligatorio, máx. 100 caracteres |
| `correo` | String | obligatorio, único, en minúsculas, formato válido, máx. 254 |
| `edad` | Number | opcional, entero ≥ 0 |
| `password` | String | obligatorio (mín. 6 caracteres), almacenado con hash bcrypt (no se devuelve en consultas) |
| `rol` | String | opcional (`"usuario"` por defecto o `"admin"`) |
| `creado_en` / `actualizado_en` | Date | automáticos |

## Endpoints

### Autenticación (`/auth`)
- `POST /auth/register` (o `POST /usuarios`) — Registrar usuario con contraseña cifrada (`201`; `400` validación; `409` correo repetido).
- `POST /auth/login` — Iniciar sesión y emitir token JWT (`200`; `400` validación; `401` credenciales inválidas).
- `GET /auth/perfil` — **(Protegida)** Obtener perfil del usuario autenticado (`200`; `401` token faltante/inválido/expirado).
- `GET /auth/admin` — **(Protegida por rol)** Panel exclusivo para rol `admin` (`200`; `401` sin token válido; `403` si el rol no es `admin`).

### Usuarios (`/usuarios`)
- `POST /usuarios` — Registrar usuario (`201`; `400` validación; `409` correo repetido).
- `GET /usuarios` — **(Protegida)** Consultar usuarios (`200`; `401` sin token válido).
- `GET /usuarios/:id` — **(Protegida: propietario o admin)** Consultar usuario por ID (`200`; `400` ID inválido; `401` sin token; `403` si intenta ver otro usuario sin ser `admin`; `404` no existe).
- `PUT /usuarios/:id` — **(Protegida: propietario o admin)** Actualizar usuario (pendiente, responde `501`).
- `DELETE /usuarios/:id` — **(Protegida: propietario o admin)** Eliminar usuario (pendiente, responde `501`).

Ejemplo de registro:

```json
POST /usuarios
{
  "nombre": "Erick Minda",
  "correo": "erick@example.com",
  "password": "miPassword123",
  "edad": 22
}
```

Ejemplo de login:

```json
POST /auth/login
{
  "correo": "erick@example.com",
  "password": "miPassword123"
}
```

Uso del token en rutas protegidas (Encabezado HTTP):

```http
Authorization: Bearer <TOKEN_JWT>
```