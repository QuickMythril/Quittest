import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AppWrapper } from '../AppWrapper';

// Lazy load the main App component
const App = lazy(() => import('../App'));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress size={48} />
  </Box>
);

interface CustomWindow extends Window {
  _qdnBase: string;
}
const customWindow = window as unknown as CustomWindow;
const baseUrl = customWindow?._qdnBase || '';

export function Routes() {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: <AppWrapper />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'post/:name/:postId',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'user/:userName',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'user/:userName/replies',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'user/:userName/followers',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'user/:userName/following',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'search/users',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
          {
            path: 'search/hashtags',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <App />
              </Suspense>
            ),
          },
        ],
      },
    ],
    {
      basename: baseUrl,
    }
  );

  return <RouterProvider router={router} />;
}
