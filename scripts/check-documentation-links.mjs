import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Deliberately bounded Markdown support: inline links/images and reference definitions.
// Mask examples without changing line numbers. This is not a CommonMark validator.
export function destinations(source) {
  const masked = source.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm,
    value => value.replace(/[^\n]/g, ' '))
    .replace(/<!--[^]*?-->/g, value => value.replace(/[^\n]/g, ' '))
    .replace(/(`+)[^\n]*?\1/g, value => ' '.repeat(value.length));
  const results = [];
  const pattern = /\]\(\s*(<[^>\n]*>|(?:\\.|[^\s()\\]|\((?:\\.|[^()\\])*\))+)\s*(?:["'][^\n]*?["']\s*)?\)|^ {0,3}\[[^\]\n]+\]:\s*(<[^>\n]*>|\S+)/gm;
  for (const match of masked.matchAll(pattern)) {
    results.push({ target: (match[1] ?? match[2]).replace(/^<|>$/g, ''),
      line: masked.slice(0, match.index).split('\n').length });
  }
  return results;
}

export function check({ cwd = process.cwd(), all = false } = {}) {
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const root = git(['rev-parse', '--show-toplevel']).trim();
  cwd = root;
  const entries = git(['ls-files', '--stage', '-z']).split('\0').filter(Boolean);
  const files = new Map();
  for (const entry of entries) {
    const [, mode, oid, stage, name] = /^(\d+) ([a-f0-9]+) (\d)\t([^]*)$/.exec(entry) ?? [];
    if (!name || stage !== '0') throw new Error('Resolve unmerged index entries before checking documentation links.');
    files.set(name, { mode, oid });
  }
  const changed = new Set(git(['diff', '--cached', '--name-only', '--no-renames', '-z']).split('\0').filter(Boolean));
  const removed = [...changed].filter(name => !files.has(name));
  const exists = target => files.has(target) || [...files.keys()].some(name => name.startsWith(`${target}/`));
  const errors = [];
  let documents = 0;
  for (const [name, entry] of files) {
    // Templates contain destination-relative examples, not live repository navigation.
    if (/^\.agents\/skills\/[^/]+\/templates\//.test(name)) continue;
    if (!name.endsWith('.md') || entry.mode !== '100644' && entry.mode !== '100755') continue;
    if (!all && !changed.has(name) && removed.length === 0) continue;
    documents++;
    const source = git(['cat-file', 'blob', entry.oid]);
    for (const { target, line } of destinations(source)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
      let decoded;
      try { decoded = decodeURIComponent(target.split(/[?#]/, 1)[0].replace(/\\([ !"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1')); }
      catch { errors.push(`${name}:${line}: invalid URL encoding: ${target}`); continue; }
      if (!decoded) continue;
      // Absolute paths refer to the author's machine, outside repository checking.
      if (decoded.startsWith('/')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), decoded)).replace(/\/$/, '');
      if (!all && !changed.has(name) && !removed.some(old => old === resolved || old.startsWith(`${resolved}/`))) continue;
      if (resolved === '..' || resolved.startsWith('../')) {
        errors.push(`${name}:${line}: link escapes repository: ${target}`);
      } else if (resolved !== '.' && !exists(resolved)) {
        errors.push(`${name}:${line}: missing tracked target: ${target}`);
      }
    }
  }
  return { errors, documents };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--all')) throw new Error('Usage: node scripts/check-documentation-links.mjs [--all]');
    const result = check({ all: process.argv.includes('--all') });
    if (result.errors.length) {
      console.error(result.errors.join('\n'));
      console.error('Fix the documentation link or stage its target. Checks use the Git index, not unstaged files.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Documentation link checker could not run: ${error.message}`);
    process.exitCode = 2;
  }
}
