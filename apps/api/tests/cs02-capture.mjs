// Test-only write observations. Captured values remain in memory; callers must independently
// compare complete persisted rows before admitting them to the ownership ledger.
export async function captureWrites(hooks, work) {
  const originals = [], observed = [];
  try {
    for (const hook of hooks) {
      if (!hook.target || typeof hook.target[hook.method] !== 'function' || typeof hook.project !== 'function') throw new Error('Invalid capture hook');
      if (originals.some(item => item.target === hook.target && item.method === hook.method)) throw new Error('Duplicate capture hook');
      const original = hook.target[hook.method];
      originals.push({ target: hook.target, method: hook.method, original });
      hook.target[hook.method] = async function (...args) {
        const result = await original.apply(this, args);
        const observation = structuredClone(hook.project(args, result));
        observed.push(observation);
        return result;
      };
    }
    const value = await work();
    return { value, observed };
  } finally {
    for (const entry of originals.reverse()) entry.target[entry.method] = entry.original;
  }
}
