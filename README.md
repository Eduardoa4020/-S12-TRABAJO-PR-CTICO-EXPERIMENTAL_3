# API de Usuarios

API REST base para la configuración inicial del backend de la Práctica 4 universitaria Full Stack de gestión de usuarios. El backend está desarrollado con Node.js y Express y se prepara para integrarse con MongoDB y autenticación JWT desde React.

Esta es la configuración inicial entregada para continuar el trabajo con el equipo. El CRUD actual opera en memoria de forma provisional y será completado en las siguientes sesiones con persistencia en MongoDB.

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
- CRUD básico de rutas para usuarios.
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

## Endpoints iniciales

- `POST /usuarios` — Registrar usuario.
- `GET /usuarios` — Consultar usuarios.
- `GET /usuarios/:id` — Consultar usuario por ID.
- `PUT /usuarios/:id` — Actualizar usuario.
- `DELETE /usuarios/:id` — Eliminar usuario.

Los endpoints mantienen el flujo inicial del proyecto y pueden extenderse con modelos Mongoose y autenticación JWT.