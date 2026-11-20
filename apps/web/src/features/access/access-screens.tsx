import { Alert, Button, Form, Input, Typography } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { AccessLayout, useSession } from '../../app/app';

type LoginFields = { username: string; password: string };
type PasswordFields = { currentPassword: string; newPassword: string };

export function LoginScreen() {
  const { signIn, pending, message } = useSession();
  const [form] = Form.useForm<LoginFields>();
  async function submit(values: LoginFields) {
    await signIn(values.username, values.password);
    form.resetFields(['password']);
  }

  return <AccessLayout>
    <p className="eyebrow">STAFF ACCESS</p><Typography.Title level={2}>Welcome back</Typography.Title><Typography.Paragraph type="secondary">Sign in to your restaurant workspace.</Typography.Paragraph>
    {message && <Alert type="error" showIcon message={message} className="feedback"/>}
    <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} autoComplete="on">
      <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Enter your username.' }]}><Input autoComplete="username" size="large"/></Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password.' }]}><Input.Password autoComplete="current-password" size="large"/></Form.Item>
      <Button type="primary" htmlType="submit" size="large" block loading={pending}>Sign in</Button>
    </Form><p className="help">Need access? Contact your administrator.</p>
  </AccessLayout>;
}

export function PasswordScreen() {
  const { updatePassword, signOut, pending, message } = useSession();
  const [form] = Form.useForm<PasswordFields>();
  async function submit(values: PasswordFields) {
    await updatePassword(values.currentPassword, values.newPassword);
    form.resetFields();
  }

  return <AccessLayout>
    <p className="eyebrow">ACCOUNT SECURITY</p><Typography.Title level={2}>Update your password</Typography.Title><Typography.Paragraph type="secondary">Your account may require a password change before you can continue. If this does not resolve access, contact your administrator.</Typography.Paragraph>
    {message && <Alert type="error" showIcon message={message} className="feedback"/>}
    <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
      <Form.Item label="Current password" name="currentPassword" rules={[{ required: true, message: 'Enter your current password.' }]}><Input.Password autoComplete="current-password" size="large"/></Form.Item>
      <Form.Item label="New password" name="newPassword" extra="Use 15–128 characters." rules={[{ required: true, message: 'Enter a new password.' }]}><Input.Password autoComplete="new-password" size="large"/></Form.Item>
      <Button type="primary" htmlType="submit" size="large" block loading={pending}>Update password</Button>
    </Form><Button type="link" onClick={() => void signOut()} loading={pending}>Sign out</Button>
  </AccessLayout>;
}

export function HomeScreen() {
  const { account, signOut, pending } = useSession();
  const navigate = useNavigate();
  return <AccessLayout>
    <p className="eyebrow">WORKSPACE</p><Typography.Title level={2}>Welcome, {account?.displayName}</Typography.Title>
    <Typography.Paragraph type="secondary">Your session is active. Your workspace will appear here as features become available.</Typography.Paragraph>
    {account?.role === 'administrator' && <Button type="primary" onClick={() => void navigate({ to: '/menu' })}>Manage menu</Button>}{' '}
    <Button onClick={() => void signOut()} loading={pending}>Sign out</Button>
  </AccessLayout>;
}
