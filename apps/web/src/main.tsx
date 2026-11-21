import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { router } from './app/router';
import { appTheme } from './app/theme';
import { createQueryClient } from './app/query-client';
import './styles.css';

const root = document.getElementById('root');
const queryClient = createQueryClient();

if (!root) {
  throw new Error('Application root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <ConfigProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
);
