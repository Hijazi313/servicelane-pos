import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { RouterProvider } from '@tanstack/react-router';

import { router } from './app/router';
import { appTheme } from './app/theme';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Application root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <ConfigProvider theme={appTheme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
);
