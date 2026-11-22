const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

const secret = 'integration-test-secret';
const memoryUsers = new Map();
const originalJwtSecret = process.env.JWT_SECRET;
const originalMethods = {
    create: User.create,
    find: User.find,
    findById: User.findById,
    findByIdAndDelete: User.findByIdAndDelete,
    findOne: User.findOne,
    save: User.prototype.save
};
let server;
let baseUrl;

async function saveToMemory(user) {
    await user.validate();
    const duplicate = [...memoryUsers.values()].find(
        (existing) => existing.correo === user.correo && existing.id !== user.id
    );
    if (duplicate) {
        const error = new Error('Correo duplicado');
        error.code = 11000;
        error.keyValue = { correo: user.correo };
        throw error;
    }

    memoryUsers.set(user.id, user);
    return user;
}

before(async () => {
    process.env.JWT_SECRET = secret;
    User.create = async (data) => saveToMemory(new User(data));
    User.find = () => ({
        sort: async () => [...memoryUsers.values()]
    });
    User.findById = async (id) => {
        const user = memoryUsers.get(String(id));
        return user ? User.hydrate(user.toObject({ transform: false })) : null;
    };
    User.findByIdAndDelete = async (id) => {
        const user = memoryUsers.get(String(id)) || null;
        if (user) memoryUsers.delete(String(id));
        return user;
    };
    User.findOne = (query) => ({
        select: async () => [...memoryUsers.values()].find(
            (user) => user.correo === query.correo
        ) || null
    });
    User.prototype.save = function save() {
        return saveToMemory(this);
    };

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
    User.create = originalMethods.create;
    User.find = originalMethods.find;
    User.findById = originalMethods.findById;
    User.findByIdAndDelete = originalMethods.findByIdAndDelete;
    User.findOne = originalMethods.findOne;
    User.prototype.save = originalMethods.save;
    if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = originalJwtSecret;
    }
});

function createToken(id, rol = 'usuario') {
    return jwt.sign({ id, rol, correo: `${rol}@example.com` }, secret);
}

async function request(path, { method = 'GET', body, token, rawBody } = {}) {
    const headers = {};
    let requestBody;
    if (rawBody !== undefined) {
        headers['Content-Type'] = 'application/json';
        requestBody = rawBody;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: requestBody
    });
    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
}

test('completa el flujo CRUD y valida respuestas, errores y permisos por HTTP', async () => {
    const primaryPassword = 'secreto123';
    const registration = await request('/auth/register', {
        method: 'POST',
        body: {
            nombre: 'Usuario Principal',
            correo: 'PRINCIPAL@example.com',
            password: primaryPassword,
            edad: 22
        }
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.body.datos.correo, 'principal@example.com');
    assert.equal(Object.hasOwn(registration.body.datos, 'password'), false);

    const primaryId = registration.body.datos.id;
    const storedPrimary = memoryUsers.get(primaryId);
    assert.notEqual(storedPrimary.password, primaryPassword);
    assert.equal(await bcrypt.compare(primaryPassword, storedPrimary.password), true);

    const publicAdminRegistration = await request('/auth/register', {
        method: 'POST',
        body: {
            nombre: 'Admin no autorizado',
            correo: 'admin-publico@example.com',
            password: 'secreto123',
            rol: 'admin'
        }
    });
    assert.equal(publicAdminRegistration.status, 403);

    const duplicate = await request('/usuarios', {
        method: 'POST',
        body: {
            nombre: 'Duplicado',
            correo: 'principal@example.com',
            password: 'secreto123'
        }
    });
    assert.equal(duplicate.status, 409);

    const noToken = await request('/usuarios');
    assert.equal(noToken.status, 401);

    const rejectedLogin = await request('/auth/login', {
        method: 'POST',
        body: { correo: 'principal@example.com', password: 'incorrecta' }
    });
    assert.equal(rejectedLogin.status, 401);

    const login = await request('/auth/login', {
        method: 'POST',
        body: { correo: 'principal@example.com', password: primaryPassword }
    });
    assert.equal(login.status, 200);
    const token = login.body.token;
    assert.ok(token);

    const profile = await request('/auth/perfil', { token });
    assert.equal(profile.status, 200);
    assert.equal(profile.body.datos.id, primaryId);

    const users = await request('/usuarios', { token });
    assert.equal(users.status, 200);
    assert.equal(users.body.total, 1);
    assert.equal(users.body.datos[0].id, primaryId);

    const byId = await request(`/usuarios/${primaryId}`, { token });
    assert.equal(byId.status, 200);

    const invalidId = await request('/usuarios/no-es-un-id', {
        method: 'PUT',
        token,
        body: { nombre: 'Inválido' }
    });
    assert.equal(invalidId.status, 400);

    const emptyUpdate = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: {}
    });
    assert.equal(emptyUpdate.status, 400);

    const invalidUpdate = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { correo: 'correo-invalido' }
    });
    assert.equal(invalidUpdate.status, 400);

    const unknownField = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { nombre: 'Usuario', isAdmin: true }
    });
    assert.equal(unknownField.status, 400);

    const shortPassword = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { password: '123' }
    });
    assert.equal(shortPassword.status, 400);

    const roleEscalation = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { rol: 'admin' }
    });
    assert.equal(roleEscalation.status, 403);

    const secondary = await request('/usuarios', {
        method: 'POST',
        body: {
            nombre: 'Segundo Usuario',
            correo: 'segundo@example.com',
            password: 'secreto123'
        }
    });
    assert.equal(secondary.status, 201);
    const secondaryId = secondary.body.datos.id;

    const duplicateEmailUpdate = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { correo: 'segundo@example.com' }
    });
    assert.equal(duplicateEmailUpdate.status, 409);

    const deniedUpdate = await request(`/usuarios/${secondaryId}`, {
        method: 'PUT',
        token,
        body: { nombre: 'No autorizado' }
    });
    assert.equal(deniedUpdate.status, 403);

    const deniedDelete = await request(`/usuarios/${secondaryId}`, {
        method: 'DELETE',
        token
    });
    assert.equal(deniedDelete.status, 403);

    const adminToken = createToken(new mongoose.Types.ObjectId().toString(), 'admin');
    const missingId = new mongoose.Types.ObjectId().toString();
    const notFound = await request(`/usuarios/${missingId}`, { token: adminToken });
    assert.equal(notFound.status, 404);
    const deleteNotFound = await request(`/usuarios/${missingId}`, {
        method: 'DELETE',
        token: adminToken
    });
    assert.equal(deleteNotFound.status, 404);

    const update = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { nombre: 'Nombre Actualizado', edad: 23 }
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.datos.nombre, 'Nombre Actualizado');
    assert.equal(update.body.datos.edad, 23);

    const passwordUpdate = await request(`/usuarios/${primaryId}`, {
        method: 'PUT',
        token,
        body: { password: 'nuevaClave123' }
    });
    assert.equal(passwordUpdate.status, 200);
    assert.equal(
        await bcrypt.compare('nuevaClave123', memoryUsers.get(primaryId).password),
        true
    );
    assert.equal(Object.hasOwn(passwordUpdate.body.datos, 'password'), false);

    const adminUpdate = await request(`/usuarios/${secondaryId}`, {
        method: 'PUT',
        token: adminToken,
        body: { rol: 'admin' }
    });
    assert.equal(adminUpdate.status, 200);
    assert.equal(adminUpdate.body.datos.rol, 'admin');

    const adminDelete = await request(`/usuarios/${secondaryId}`, {
        method: 'DELETE',
        token: adminToken
    });
    assert.equal(adminDelete.status, 200);
    assert.equal(memoryUsers.has(secondaryId), false);

    const malformedJson = await request('/usuarios', {
        method: 'POST',
        rawBody: '{"nombre":'
    });
    assert.equal(malformedJson.status, 400);

    const invalidAge = await request('/usuarios', {
        method: 'POST',
        body: {
            nombre: 'Edad inválida',
            correo: 'edad@example.com',
            password: 'secreto123',
            edad: 2.5
        }
    });
    assert.equal(invalidAge.status, 400);

    const selfDelete = await request(`/usuarios/${primaryId}`, {
        method: 'DELETE',
        token
    });
    assert.equal(selfDelete.status, 200);
    assert.equal(memoryUsers.has(primaryId), false);
    const deletedProfile = await request('/auth/perfil', { token });
    assert.equal(deletedProfile.status, 404);
});
