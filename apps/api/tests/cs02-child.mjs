// Bounded child lifecycle; no database/configuration imports.
export async function runChild(spawn, executable, path, env, input, deadlineMs = 60000) {
  const child = spawn(executable, [path], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', bytes = 0, overflow = false, timedOut = false, startFailed = false;
  child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes <= 16384) output += chunk; else { overflow = true; child.kill('SIGKILL'); } });
  child.stderr.on('data', chunk => { bytes += chunk.length; if (bytes > 16384) { overflow = true; child.kill('SIGKILL'); } });
  const done = new Promise(resolve => {
    child.once('error', () => { startFailed = true; });
    child.once('close', code => resolve(code));
  });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, deadlineMs);
  child.stdin.on('error', () => {}); child.stdin.end(JSON.stringify(input));
  try {
    const exit = await done;
    let response;
    try { response = JSON.parse(output); } catch { response = undefined; }
    if (timedOut || overflow || startFailed || exit !== 0 || response?.marker !== 'CS02 restart passed' || !Array.isArray(response?.access) || response.access.length === 0) {
      throw new Error(timedOut ? 'CS02_CHILD_TIMEOUT' : overflow ? 'CS02_CHILD_OUTPUT_LIMIT' : startFailed ? 'CS02_CHILD_START' : 'CS02_CHILD_FAILED');
    }
    return { exit: 0, marker: 'CS02 restart passed', access: response.access };
  } finally { clearTimeout(timer); }
}
