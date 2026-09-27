const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { TechniciansService } = require('../dist/technicians/technicians.service');
const { IncidentsService } = require('../dist/incidents/incidents.service');
const { formatError } = require('../dist/common/errors');
let app, url, initial;
const fields = 'id title description status priority createdAt assignee { id name specialty active }';
const list = `query($filter: IncidentFilterInput, $pagination: PaginationInput) {
  incidents(filter: $filter, pagination: $pagination) {
    items { ${fields} } pageInfo { page pageSize totalItems totalPages hasNextPage }
  }
}`;
async function gql(query, variables = {}) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}
function error(result, code) {
  assert.ok(result.errors?.length, JSON.stringify(result));
  assert.equal(result.errors[0].extensions.code, code);
  assert.deepEqual(Object.keys(result.errors[0].extensions), ['code']);
  assert.doesNotMatch(JSON.stringify(result), /stacktrace|node_modules|[A-Z]:\\/);
}
before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  url = (await app.getUrl()) + '/graphql';
  initial = (await gql(list, { pagination: { pageSize: 20 } })).data.incidents.items;
});
after(async () => { await app?.close(); });

test('seed, defaults, complete pagination and empty pages', async () => {
  assert.equal(initial.length, 15);
  assert.equal(new Set(initial.map(i => i.assignee.id)).size, 3);
  for (const i of initial) {
    assert.match(i.id, /^[0-9a-f-]{36}$/);
    assert.ok(Number.isFinite(Date.parse(i.createdAt)));
  }
  const result = (await gql(list)).data.incidents;
  assert.equal(result.items.length, 10);
  assert.deepEqual(result.pageInfo, { page: 1, pageSize: 10, totalItems: 15, totalPages: 2, hasNextPage: true });
  const second = (await gql(list, { pagination: { page: 2 } })).data.incidents;
  assert.equal(second.items.length, 5);
  assert.equal(second.pageInfo.hasNextPage, false);
  const empty = (await gql(list, { pagination: { page: 50 } })).data.incidents;
  assert.deepEqual(empty.items, []);
  assert.equal(empty.pageInfo.hasNextPage, false);
  const none = (await gql(list, { filter: { search: 'zzzzzz' } })).data.incidents;
  assert.equal(none.pageInfo.totalPages, 0);
});

test('filters combine before pagination and search ignores case', async () => {
  const filter = { status: 'OPEN', priority: 'LOW', assigneeId: initial[0].assignee.id, search: 'RED' };
  const result = (await gql(list, { filter, pagination: { pageSize: 1 } })).data.incidents;
  const expected = initial.filter(i => i.status === filter.status && i.priority === filter.priority && i.assignee.id === filter.assigneeId && i.title.toLowerCase().includes('red'));
  assert.equal(result.pageInfo.totalItems, expected.length);
  assert.deepEqual(result.items, expected.slice(0, 1));
  const search = (await gql(list, { filter: { search: 'eRrOr' }, pagination: { pageSize: 20 } })).data.incidents;
  assert.equal(search.items.length, 3);
});

test('relations use exactly one batch containing unique page technician IDs', async () => {
  const service = app.get(TechniciansService);
  const original = service.findByIds;
  const calls = [];
  service.findByIds = function(ids) { calls.push(ids); return original.call(this, ids); };
  try {
    const result = await gql(list, { pagination: { pageSize: 20 } });
    assert.equal(result.errors, undefined);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, 3);
  } finally { service.findByIds = original; }
});

test('pagination rejects unsafe values and service enforces its own limit', async () => {
  for (const pagination of [{ pageSize: 21 }, { pageSize: 0 }, { page: 0 }, { page: -1 }, { page: 1.5 }, { pageSize: null }]) {
    error(await gql(list, { pagination }), 'BAD_USER_INPUT');
  }
  assert.throws(() => app.get(IncidentsService).findAll(undefined, { page: 1, pageSize: 21 }), /20/);
});

test('create, retrieve, partial update, reassign, clear description', async () => {
  const create = `mutation($input: CreateIncidentInput!) { createIncident(input: $input) { ${fields} } }`;
  const update = `mutation($id: ID!, $input: UpdateIncidentInput!) { updateIncident(id: $id, input: $input) { ${fields} } }`;
  const input = { title: 'Nueva incidencia', description: 'Detalle', priority: 'HIGH', assigneeId: initial[0].assignee.id };
  const created = (await gql(create, { input })).data.createIncident;
  assert.equal(created.status, 'OPEN');
  assert.equal(created.title, input.title);
  assert.ok(Math.abs(Date.now() - Date.parse(created.createdAt)) < 10000);
  const found = await gql(`query($id: ID!) { incident(id: $id) { ${fields} } }`, { id: created.id });
  assert.deepEqual(found.data.incident, created);
  const updated = (await gql(update, { id: created.id, input: { status: 'RESOLVED', assigneeId: initial[10].assignee.id, description: null } })).data.updateIncident;
  assert.equal(updated.title, created.title);
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal(updated.status, 'RESOLVED');
  assert.equal(updated.description, null);
  assert.equal(updated.assignee.id, initial[10].assignee.id);
  for (const invalid of [{ title: 'ab' }, { title: 'x'.repeat(101) }, { description: 'x'.repeat(501) }, { assigneeId: 'invalid' }, { priority: 'URGENT' }, { status: 'OPEN' }, { id: randomUUID() }, { createdAt: new Date().toISOString() }]) {
    error(await gql(create, { input: { ...input, ...invalid } }), 'BAD_USER_INPUT');
  }
  for (const invalid of [{ title: null }, { status: null }, { priority: null }, { assigneeId: null }, { title: 'ab' }, { description: 'x'.repeat(501) }]) {
    error(await gql(update, { id: created.id, input: invalid }), 'BAD_USER_INPUT');
  }
  error(await gql(create, { input: { ...input, assigneeId: randomUUID() } }), 'NOT_FOUND');
  error(await gql(update, { id: created.id, input: { title: 'Should not persist', assigneeId: randomUUID() } }), 'NOT_FOUND');
  const unchanged = await gql(`query($id: ID!) { incident(id: $id) { title } }`, { id: created.id });
  assert.equal(unchanged.data.incident.title, created.title);
  error(await gql(update, { id: randomUUID(), input: {} }), 'NOT_FOUND');
  error(await gql('{ incident(id: "missing") { id } }'), 'NOT_FOUND');
});

test('generated schema is public and errors cannot leak internal details', () => {
  const schema = readFileSync('schema.gql', 'utf8');
  const incident = schema.match(/type Incident \{([^}]+)\}/)[1];
  assert.doesNotMatch(incident, /assigneeId/);
  assert.match(incident, /assignee: Technician!/);
  assert.match(schema, /items: \[Incident!\]!/);
  assert.match(schema, /pageSize: Int! = 10/);
  assert.deepEqual(formatError({ message: 'Secret path', extensions: { code: 'INTERNAL_SERVER_ERROR', stacktrace: ['secret'] } }), {
    message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
});
