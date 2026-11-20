import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Spin, Typography } from 'antd';
import { AccessRequestError, changePassword, currentAccount, login, logout, type Account } from '../features/access/access-api';
import { routeForAccess, type AccessRequirement, type Screen } from './session-route';

type Session = {
  screen: Screen;
  account?: Account;
  pending: boolean;
  message: string;
  signIn: (username: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Session boundary is missing');
  return session;
}

export function App() {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<Screen>('checking');
  const [account, setAccount] = useState<Account>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    queryClient.clear();
    setScreen('checking');
    setAccount(undefined);
    setMessage('');
    try {
      const next = await currentAccount();
      setAccount(next);
      setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      if (error instanceof AccessRequestError && error.status === 401) setScreen('login');
      else if (error instanceof AccessRequestError && error.status === 403) setScreen('restricted');
      else setScreen('unavailable');
    }
  }, [queryClient]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function signIn(username: string, password: string): Promise<void> {
    queryClient.clear();
    setPending(true);
    setMessage('');
    try {
      const next = await login(username, password);
      setAccount(next);
      setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      if (error instanceof AccessRequestError && error.status === 401) setMessage('Username or password was not accepted.');
      else if (error instanceof AccessRequestError && error.status === 429) setMessage('Too many attempts. Please wait before trying again.');
      else if (error instanceof AccessRequestError && error.status === 400) setMessage('Check your username and password and try again.');
      else setScreen('unknown');
    } finally {
      setPending(false);
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    queryClient.clear();
    setPending(true);
    setMessage('');
    try {
      const next = await changePassword(currentPassword, newPassword);
      setAccount(next);
      setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      if (error instanceof AccessRequestError && (error.status === 400 || error.status === 401)) {
        setMessage('Password change was not accepted. Check the current password and choose a different new password.');
      } else setScreen('unknown');
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    queryClient.clear();
    setPending(true);
    setMessage('');
    try {
      await logout();
      setAccount(undefined);
      setScreen('login');
    } catch {
      setAccount(undefined);
      setScreen('unknown');
    } finally {
      setPending(false);
    }
  }

  return <SessionContext.Provider value={{ screen, account, pending, message, signIn, updatePassword, signOut, refresh }}>
    <Outlet />
  </SessionContext.Provider>;
}

export function AccessLayout({ children }: { children: React.ReactNode }) {
  return <div className="access-page">
    <header className="access-header"><span className="brand-mark" aria-hidden="true">s</span><span>Restaurant workspace</span></header>
    <main className="access-main"><section className="access-card" aria-live="polite">{children}</section>
      <p className="access-footer">Secure access for your restaurant team</p>
    </main>
  </div>;
}

export function SessionGate({ require, children }: { require: AccessRequirement; children: React.ReactNode }) {
  const { screen, account, refresh } = useSession();
  const navigate = useNavigate();
  const target = routeForAccess(screen, require, account?.role);

  useEffect(() => {
    if (target) void navigate({ to: target, replace: true });
  }, [target, navigate]);

  if (screen === 'checking') return <AccessLayout><div className="state"><Spin size="large"/><p>Checking your session…</p></div></AccessLayout>;
  if (screen === 'unavailable' || screen === 'unknown') return <AccessLayout>
    <p className="eyebrow">CONNECTION</p><Typography.Title level={2}>Unable to confirm your session</Typography.Title>
    <Typography.Paragraph type="secondary">{screen === 'unknown' ? 'The last action may or may not have completed. Check your session before continuing.' : 'The server could not be reached or returned an unexpected response.'}</Typography.Paragraph>
    <Button type="primary" onClick={() => void refresh()}>Check session</Button>
  </AccessLayout>;
  if (target) return null;
  return children;
}
