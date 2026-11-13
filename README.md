# API de Usuarios

API REST básica para usuarios, desarrollada con Node.js, Express y PostgreSQL. Las rutas actuales son provisionales: todavía no realizan operaciones sobre la base de datos.

## Tecnologías

- Node.js
- Express
- PostgreSQL

## Instalación

```bash
npm install
```

En PowerShell, copia el archivo de ejemplo y completa tus credenciales:

```powershell
Copy-Item .env.example .env
```

Edita `.env` con el usuario y la contraseña de PostgreSQL.

## Base de datos

Con PostgreSQL instalado y en ejecución, crea la base y la tabla desde PowerShell:

```powershell
$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
& $psql -U postgres -W -f .\database\create_database.sql
& $psql -U postgres -W -d api_usuarios -f .\database\schema.sql
```

La tabla `usuarios` contiene `id`, `nombre`, `correo` (único), `edad` (opcional) y `creado_en`.

## Ejecución

```bash
npm start
```

Al iniciar, la aplicación comprueba la conexión a PostgreSQL. Si la conexión falla, muestra el error y no inicia el servidor. Cuando está conectado, el servidor se ejecuta en `http://localhost:3000`.

## Endpoints

- `POST /usuarios` — Registrar usuario.
- `GET /usuarios` — Consultar usuarios.
- `GET /usuarios/:id` — Consultar usuario por ID.
- `PUT /usuarios/:id` — Actualizar usuario.
- `DELETE /usuarios/:id` — Eliminar usuario.

Por ahora, los endpoints solo responden con mensajes de texto; la lógica CRUD se implementará por separado.

## Licencia

ISC