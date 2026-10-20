import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { inspectSource, checkModules } from '../scripts/check-http-boundaries.mjs';
const fixtures = resolve(import.meta.dirname, 'fixtures/http-boundaries');
const rules = findings => findings.map(row => row.rule);
async function fixture(group, layer, name) {
  const filename = join(fixtures, group, layer, name);
  return inspectSource(filename, await readFile(filename, 'utf8'));
}

test('passing fixtures allow semantic errors, business status/price, DI aliases and HTTP-layer exceptions', async () => {
  assert.deepEqual(inspectSource('/modules/demo/application/di.ts', "import * as Nest from '@nestjs/common'; @Nest.Injectable() class Service {}"), []);
  for (const [layer, name] of [['domain', 'capture.ts'], ['application', 'orders.service.ts'], ['http', 'error.filter.ts']]) assert.deepEqual(await fixture('pass', layer, name), []);
});
test('original status-bearing domain error is rejected with useful source location', async () => {
  const findings = await fixture('fail', 'domain', 'status.ts');
  assert.deepEqual(rules(findings), ['ERROR_HTTP_STATUS']);
  assert.equal(findings[0].line, 2); assert.ok(findings[0].column > 0);
});
test('HTTP imports, aliased exception construction, domain framework use and reexports are rejected', async () => {
  assert.deepEqual(rules(await fixture('fail', 'application', 'transport.ts')), ['HTTP_IMPORT', 'HTTP_IMPORT', 'HTTP_EXCEPTION']);
  assert.deepEqual(rules(await fixture('fail', 'domain', 'framework.ts')), ['HTTP_IMPORT', 'HTTP_IMPORT']);
});
test('local inheritance, literal computed members and getters cannot hide error status ownership', async () => {
  assert.deepEqual(rules(await fixture('fail', 'application', 'inherited.ts')), ['ERROR_HTTP_STATUS', 'ERROR_HTTP_STATUS']);
  assert.deepEqual(rules(inspectSource('/modules/demo/domain/assignment.ts', 'class Failure extends Error { constructor() { super(); this.status = 400; } }')), ['ERROR_HTTP_STATUS']);
  assert.deepEqual(rules(inspectSource('/modules/demo/domain/error.ts', "class E extends globalThis.Error { get ['statusCode']() { return 400; } }")), ['ERROR_HTTP_STATUS']);
});
test('namespace/dynamic/require/import-equals/import-type HTTP dependencies and parser failures are reported', () => {
  for (const source of ["import * as Nest from '@nestjs/common'; new Nest.HttpException('Bad', 400);", "const http = await import('node:http');", "const api = require('../http/public.js');", "import api = require('express');", "export * from '@nestjs/common';", "type Request = import('node:http').IncomingMessage;", "import { HttpException as Failure } from '@nestjs/common/exceptions/http.exception';"]) {
    assert.ok(inspectSource('/modules/demo/application/use-case.ts', source).some(row => row.rule === 'HTTP_IMPORT'));
  }
  assert.ok(inspectSource('/modules/demo/domain/broken.ts', 'export class {').some(row => row.rule === 'PARSE'));
});
test('module discovery is strict, scoped explicitly and does not silently ignore invalid/empty selectors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'http-boundaries-'));
  try {
    for (const module of ['good', 'bad']) await mkdir(join(root, 'src/modules', module, 'domain'), { recursive: true });
    await writeFile(join(root, 'src/modules/good/domain/error.ts'), 'export class E extends Error { code = "INVALID"; }');
    await writeFile(join(root, 'src/modules/bad/domain/error.ts'), 'export class E extends Error { status = 400; }');
    assert.equal((await checkModules(root)).findings.length, 1);
    assert.equal((await checkModules(root, ['good'])).findings.length, 0);
    await assert.rejects(() => checkModules(root, ['missing']));
    await assert.rejects(() => checkModules(root, ['../bad']));
    await mkdir(join(root, 'src/modules/empty'));
    await assert.rejects(() => checkModules(root, ['empty']), /No domain/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('CLI exit code reflects real findings, explicit module selection and invalid arguments', async () => {
  const script = resolve(import.meta.dirname, '../scripts/check-http-boundaries.mjs');
  const full = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  const result = await checkModules(resolve(import.meta.dirname, '..'));
  assert.equal(full.status, result.findings.length ? 1 : 0);
  for (const finding of result.findings) assert.ok(full.stderr.includes(`${finding.file}:${finding.line}:${finding.column} [${finding.rule}]`));
  const scoped = spawnSync(process.execPath, [script, '--module', 'menu', '--module', 'orders'], { encoding: 'utf8' });
  assert.equal(scoped.status, 0, scoped.stderr); assert.match(scoped.stdout, /0 violation/);
  const invalid = spawnSync(process.execPath, [script, '--unknown'], { encoding: 'utf8' }); assert.equal(invalid.status, 1);
});
