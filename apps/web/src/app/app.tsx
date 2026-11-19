import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Spin, Typography } from 'antd';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { pathForScreen, type Screen } from './session-route';
import { AccessRequestError, changePassword, currentAccount, login, logout, type Account } from '../features/access/access-api';

type LoginFields = { username: string; password: string };
type PasswordFields = { currentPassword: string; newPassword: string };

export function App() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [screen, setScreen] = useState<Screen>('checking');
  const [account, setAccount] = useState<Account>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [loginForm] = Form.useForm<LoginFields>();
  const [passwordForm] = Form.useForm<PasswordFields>();

  const refresh = useCallback(async () => {
    setScreen('checking'); setAccount(undefined); setMessage('');
    try {
      const next = await currentAccount();
      setAccount(next); setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      if (error instanceof AccessRequestError && error.status === 401) setScreen('login');
      else if (error instanceof AccessRequestError && error.status === 403) setScreen('restricted');
      else setScreen('unavailable');
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const target = pathForScreen(screen);
    if (target && pathname !== target) void navigate({ to: target, replace: true });
  }, [screen, pathname, navigate]);

  async function signIn(values: LoginFields) {
    setPending(true); setMessage('');
    try {
      const next = await login(values.username, values.password);
      loginForm.resetFields(['password']); setAccount(next);
      setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      loginForm.resetFields(['password']);
      if (error instanceof AccessRequestError && error.status === 401) setMessage('Username or password was not accepted.');
      else if (error instanceof AccessRequestError && error.status === 429) setMessage('Too many attempts. Please wait before trying again.');
      else if (error instanceof AccessRequestError && error.status === 400) setMessage('Check your username and password and try again.');
      else setScreen('unknown');
    } finally { setPending(false); }
  }

  async function updatePassword(values: PasswordFields) {
    setPending(true); setMessage('');
    try {
      const next = await changePassword(values.currentPassword, values.newPassword);
      passwordForm.resetFields(); setAccount(next); setScreen(next.passwordChangeRequired ? 'restricted' : 'home');
    } catch (error) {
      passwordForm.resetFields();
      if (error instanceof AccessRequestError && (error.status === 400 || error.status === 401)) setMessage('Password change was not accepted. Check the current password and choose a different new password.');
      else setScreen('unknown');
    } finally { setPending(false); }
  }

  async function signOut() {
    setPending(true); setMessage('');
    try { await logout(); setAccount(undefined); setScreen('login'); }
    catch { setAccount(undefined); setScreen('unknown'); }
    finally { setPending(false); }
  }

  return <div className="access-page"><header className="access-header"><span className="brand-mark" aria-hidden="true">s</span><span>Restaurant workspace</span></header>
    <main className="access-main"><section className="access-card" aria-live="polite">
      {screen === 'checking' && <div className="state"><Spin size="large"/><p>Checking your session…</p></div>}
      {screen === 'login' && <><p className="eyebrow">STAFF ACCESS</p><Typography.Title level={2}>Welcome back</Typography.Title><Typography.Paragraph type="secondary">Sign in to your restaurant workspace.</Typography.Paragraph>
        {message && <Alert type="error" showIcon message={message} className="feedback"/>}
        <Form form={loginForm} layout="vertical" onFinish={signIn} requiredMark={false} autoComplete="on">
          <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Enter your username.' }]}><Input autoComplete="username" size="large"/></Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password.' }]}><Input.Password autoComplete="current-password" size="large"/></Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={pending}>Sign in</Button>
        </Form><p className="help">Need access? Contact your administrator.</p></>}
      {screen === 'restricted' && <><p className="eyebrow">ACCOUNT SECURITY</p><Typography.Title level={2}>Update your password</Typography.Title><Typography.Paragraph type="secondary">Your account may require a password change before you can continue. If this does not resolve access, contact your administrator.</Typography.Paragraph>
        {message && <Alert type="error" showIcon message={message} className="feedback"/>}
        <Form form={passwordForm} layout="vertical" onFinish={updatePassword} requiredMark={false}>
          <Form.Item label="Current password" name="currentPassword" rules={[{ required: true, message: 'Enter your current password.' }]}><Input.Password autoComplete="current-password" size="large"/></Form.Item>
          <Form.Item label="New password" name="newPassword" extra="Use 15–128 characters." rules={[{ required: true, message: 'Enter a new password.' }]}><Input.Password autoComplete="new-password" size="large"/></Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={pending}>Update password</Button>
        </Form><Button type="link" onClick={() => void signOut()} loading={pending}>Sign out</Button></>}
      {screen === 'home' && <><p className="eyebrow">WORKSPACE</p><Typography.Title level={2}>Welcome, {account?.displayName}</Typography.Title><Typography.Paragraph type="secondary">Your session is active. Your workspace will appear here as features become available.</Typography.Paragraph><Button onClick={() => void signOut()} loading={pending}>Sign out</Button></>}
      {(screen === 'unavailable' || screen === 'unknown') && <><p className="eyebrow">CONNECTION</p><Typography.Title level={2}>Unable to confirm your session</Typography.Title><Typography.Paragraph type="secondary">{screen === 'unknown' ? 'The last action may or may not have completed. Check your session before continuing.' : 'The server could not be reached or returned an unexpected response.'}</Typography.Paragraph><Button type="primary" onClick={() => void refresh()}>Check session</Button></>}
    </section><p className="access-footer">Secure access for your restaurant team</p></main></div>;
}
