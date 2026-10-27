import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { check, destinations } from '../check-documentation-links.mjs';

function repository(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'documentation-links-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
  git('init', '-q');
  const write = (name, text) => { mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true }); writeFileSync(path.join(cwd, name), text); };
  const commit = () => git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture');
  return { cwd, git, write, commit };
}

test('extracts inline, image and reference paths; skips code and comments', () => {
  assert.deepEqual(destinations('[x](a(b).md) ![x](<with space.md>)\n[r]: ref.md "title"\n`[x](no.md)`\n```md\n[x](no.md)\n```\n<!-- [x](no.md) -->').map(x => x.target), ['a(b).md', 'with space.md', 'ref.md']);
});

test('initial index, encoded paths, directory targets and external/anchor exclusions', t => {
  const r = repository(t);
  r.write('docs/map.md', '[x](../a%20b.md#heading) [dir](../src/) [web](https://example.invalid) [anchor](#heading)');
  r.write('a b.md', 'ok'); r.write('src/code.ts', ''); r.git('add', '.');
  assert.deepEqual(check({ cwd: r.cwd }).errors, []);
});

test('checks staged bytes and ignores an unstaged fix or untracked target', t => {
  const r = repository(t);
  r.write('map.md', '[x](missing.md)'); r.git('add', '.');
  r.write('map.md', 'fixed'); r.write('missing.md', 'untracked');
  assert.match(check({ cwd: r.cwd }).errors[0], /missing tracked target/);
});

test('unchanged incoming references catch deletion, rename and deleted directory', t => {
  const r = repository(t);
  r.write('map.md', '[x](src/a.ts) [directory](src/)'); r.write('src/a.ts', '');
  r.git('add', '.'); r.commit(); r.git('mv', 'src/a.ts', 'b.ts');
  assert.equal(check({ cwd: r.cwd }).errors.length, 2);
  r.write('map.md', '[x](b.ts)'); r.git('add', 'map.md');
  assert.deepEqual(check({ cwd: r.cwd }).errors, []);
});

test('unrelated code commit skips existing broken docs; full mode reports them', t => {
  const r = repository(t);
  r.write('map.md', '[x](missing.md)'); r.git('add', '.'); r.commit();
  r.write('code.ts', ''); r.git('add', '.');
  assert.equal(check({ cwd: r.cwd }).documents, 0);
  assert.equal(check({ cwd: r.cwd, all: true }).errors.length, 1);
});

test('template placeholders excluded, reference definitions checked, escapes reported', t => {
  const r = repository(t);
  r.write('.agents/skills/example/templates/example.md', '[x](spec.md)');
  r.write('map.md', '[ref][r]\n[r]: missing.md\n[x](../outside.md)'); r.git('add', '.');
  assert.equal(check({ cwd: r.cwd }).errors.length, 2);
});

test('worktrees and nested invocation use their own index', t => {
  const r = repository(t); r.write('map.md', 'ok'); r.git('add', '.'); r.commit();
  const worktree = path.join(r.cwd, 'checkout'); r.git('worktree', 'add', '-qb', 'topic', worktree);
  r.write('checkout/docs/map.md', '[x](missing.md)');
  execFileSync('git', ['add', '.'], { cwd: worktree });
  assert.equal(check({ cwd: path.join(worktree, 'docs') }).errors.length, 1);
  assert.equal(check({ cwd: r.cwd }).errors.length, 0);
});
