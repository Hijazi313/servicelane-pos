// Test-only coordination. The observer must establish an actual PostgreSQL lock wait.
export async function contend({ target, method, first, second, observe, timeoutMs = 10000 }) {
  if (!target || typeof target[method] !== 'function' || typeof first !== 'function'
      || typeof second !== 'function' || typeof observe !== 'function') throw new Error('Invalid contention inputs');
  const original = target[method];
  let enteredResolve, releaseResolve, timer;
  const entered = new Promise(resolve => { enteredResolve = resolve; });
  const release = new Promise(resolve => { releaseResolve = resolve; });
  let intercepted = false;
  target[method] = async function (...args) {
    if (!intercepted) { intercepted = true; enteredResolve(args.at(-1)); await release; }
    return original.apply(this, args);
  };
  const outcome = work => Promise.resolve().then(work).then(value => ({ value }), error => ({ error }));
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Contention coordination timeout')), timeoutMs); });
  const firstResult = outcome(first);
  let secondResult;
  try {
    const transaction = await Promise.race([entered, firstResult.then(() => { throw new Error('First operation did not reach barrier'); }), deadline]);
    secondResult = outcome(second);
    await Promise.race([observe(transaction), secondResult.then(() => { throw new Error('Contender completed before lock observation'); }), deadline]);
    releaseResolve();
    return await Promise.race([Promise.all([firstResult, secondResult]), deadline]);
  } finally {
    releaseResolve();
    target[method] = original;
    clearTimeout(timer);
    // Await both callers so a failed observation cannot leave an in-flight transaction behind.
    await Promise.all([firstResult, ...(secondResult ? [secondResult] : [])]);
  }
}
