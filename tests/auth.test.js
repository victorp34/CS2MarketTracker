// Tests d'intégration sur /api/auth. Nécessite une base PostgreSQL accessible
// (via le .env local, ex: docker compose up -d avant de lancer `npm test`).
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const pool = require('../db');

// Email unique à chaque run pour ne pas entrer en conflit avec un test précédent
const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

test('POST /api/auth/register crée un compte et renvoie un token', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: uniqueEmail(), password: 'motdepasse123' });

  assert.equal(res.status, 201);
  assert.ok(res.body.token, 'un token doit être renvoyé');
});

test('POST /api/auth/register refuse un email déjà utilisé', async () => {
  const email = uniqueEmail();
  await request(app).post('/api/auth/register').send({ email, password: 'motdepasse123' });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'autremotdepasse' });

  assert.equal(res.status, 409);
});

test('POST /api/auth/register refuse un email mal formé', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'pas-un-email', password: 'motdepasse123' });

  assert.equal(res.status, 400);
});

test('POST /api/auth/register refuse un mot de passe trop court', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: uniqueEmail(), password: '123' });

  assert.equal(res.status, 400);
});

test('POST /api/auth/login refuse un mauvais mot de passe', async () => {
  const email = uniqueEmail();
  await request(app).post('/api/auth/register').send({ email, password: 'motdepasse123' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'mauvais_mot_de_passe' });

  assert.equal(res.status, 401);
});

test('POST /api/auth/login réussit avec les bons identifiants', async () => {
  const email = uniqueEmail();
  await request(app).post('/api/auth/register').send({ email, password: 'motdepasse123' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'motdepasse123' });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

// Ferme le pool de connexions une fois tous les tests du fichier terminés,
// sinon le processus `node --test` ne se termine jamais.
after(() => pool.end());
