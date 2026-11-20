export type Screen = 'checking' | 'login' | 'restricted' | 'home' | 'unavailable' | 'unknown';
export type AccessPath = '/' | '/login' | '/change-password';
export type AccessRequirement = 'login' | 'restricted' | 'staff' | 'administrator';

export function routeForAccess(
  screen: Screen,
  requirement: AccessRequirement,
  role?: 'administrator' | 'staff',
): AccessPath | undefined {
  if (screen === 'login') return requirement === 'login' ? undefined : '/login';
  if (screen === 'restricted') return requirement === 'restricted' ? undefined : '/change-password';
  if (screen !== 'home') return undefined;
  if (requirement === 'login' || requirement === 'restricted') return '/';
  if (requirement === 'administrator' && role !== 'administrator') return '/';
  return undefined;
}
