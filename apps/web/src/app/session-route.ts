export type Screen = 'checking' | 'login' | 'restricted' | 'home' | 'unavailable' | 'unknown';
export type AccessPath = '/' | '/login' | '/change-password';

// Uncertain state retains its URL and never selects a protected screen.
export function pathForScreen(screen: Screen): AccessPath | undefined {
  if (screen === 'login') return '/login';
  if (screen === 'restricted') return '/change-password';
  if (screen === 'home') return '/';
  return undefined;
}
