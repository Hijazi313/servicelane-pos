// Bounded child lifecycle; no database/configuration imports.
export async function runChild(spawn, executable, path, env, input, deadlineMs = 60000) {
  const child = spawn(executable, [path], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', bytes = 0, overflow = false, timedOut = false, startFailed = false;
  child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes <= 256) output += chunk; else { overflow = true; child.kill('SIGKILL'); } });
  child.stderr.on('data', chunk => { bytes += chunk.length; if (bytes > 4096) { overflow = true; child.kill('SIGKILL'); } });
  const done = new Promise(resolve => {
    child.once('error', () => { startFailed = true; });
    child.once('close', code => resolve(code));
  });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, deadlineMs);
  child.stdin.on('error', () => {}); child.stdin.end(JSON.stringify(input));
  try {
    const exit = await done;
    if (timedOut || overflow || startFailed || exit !== 0 || output.trim() !== 'BP02 restart passed') {
      throw new Error(timedOut ? 'BP02_CHILD_TIMEOUT' : overflow ? 'BP02_CHILD_OUTPUT_LIMIT' : startFailed ? 'BP02_CHILD_START' : 'BP02_CHILD_FAILED');
    }
    return { exit: 0, marker: 'BP02 restart passed' };
  } finally { clearTimeout(timer); }
}
