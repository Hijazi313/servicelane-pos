// Test-only lifecycle shared by the real restart probe and offline failure checks.
export async function runRestartProbe(pool, work) {
  let idleConnectionFailed = false;
  pool.on('error', () => { idleConnectionFailed = true; });
  try {
    await work();
  } finally {
    await pool.end();
  }
  // Check after shutdown too: successful requests must not hide an idle failure.
  if (idleConnectionFailed) throw new Error('Acceptance database connection failed');
}
