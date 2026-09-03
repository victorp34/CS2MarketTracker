// Tests d'intégration sur /api/alerts. Nécessite une base PostgreSQL accessible.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const pool = require('../db');

let token;

before(async () => {
  const email = `test-alerts-${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'motdepasse123' });
  token = res.body.token;
});

test('GET /api/alerts sans token est rejeté (401)', async () => {
  const res = await request(app).get('/api/alerts');
  assert.equal(res.status, 401);
});

test('POST /api/alerts sans token est rejeté (401)', async () => {
  const res = await request(app)
    .post('/api/alerts')
    .send({ market_hash_name: 'AK-47 | Redline (Field-Tested)', target_price: 30, direction: 'below' });
  assert.equal(res.status, 401);
});

test('POST /api/alerts refuse un target_price négatif ou nul', async () => {
  const res = await request(app)
    .post('/api/alerts')
    .set('Authorization', `Bearer ${token}`)
    .send({ market_hash_name: 'AK-47 | Redline (Field-Tested)', target_price: -5, direction: 'below' });
  assert.equal(res.status, 400);
});

test('POST /api/alerts refuse un target_price excessif', async () => {
  const res = await request(app)
    .post('/api/alerts')
    .set('Authorization', `Bearer ${token}`)
    .send({ market_hash_name: 'AK-47 | Redline (Field-Tested)', target_price: 99_000_000, direction: 'below' });
  assert.equal(res.status, 400);
});

test('POST /api/alerts refuse une direction invalide', async () => {
  const res = await request(app)
    .post('/api/alerts')
    .set('Authorization', `Bearer ${token}`)
    .send({ market_hash_name: 'AK-47 | Redline (Field-Tested)', target_price: 30, direction: 'sideways' });
  assert.equal(res.status, 400);
});

test('Cycle complet : créer, lister, modifier, supprimer une alerte', async () => {
  const createRes = await request(app)
    .post('/api/alerts')
    .set('Authorization', `Bearer ${token}`)
    .send({ market_hash_name: 'AWP | Asiimov (Field-Tested)', target_price: 50, direction: 'below' });
  assert.equal(createRes.status, 201);
  const alertId = createRes.body.id;

  const listRes = await request(app)
    .get('/api/alerts')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.some((a) => a.id === alertId));

  const patchRes = await request(app)
    .patch(`/api/alerts/${alertId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ is_active: false });
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.body.is_active, false);

  const deleteRes = await request(app)
    .delete(`/api/alerts/${alertId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(deleteRes.status, 204);
});

after(() => pool.end());
