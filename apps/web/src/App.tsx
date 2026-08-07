import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { LandingPage } from './pages/LandingPage';

const SignInPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.SignInPage })),
);
const SignUpPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.SignUpPage })),
);
const NotesPage = lazy(() =>
  import('./pages/NotesPage').then((module) => ({ default: module.NotesPage })),
);
const NewNotePage = lazy(() =>
  import('./pages/NewNotePage').then((module) => ({ default: module.NewNotePage })),
);
const EditNotePage = lazy(() =>
  import('./pages/EditNotePage').then((module) => ({ default: module.EditNotePage })),
);
const PublicNotePage = lazy(() =>
  import('./pages/PublicNotePage').then((module) => ({ default: module.PublicNotePage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);

function deferred(element: React.ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/sign-in',
    element: deferred(
      <PublicOnlyRoute>
        <SignInPage />
      </PublicOnlyRoute>,
    ),
  },
  {
    path: '/sign-up',
    element: deferred(
      <PublicOnlyRoute>
        <SignUpPage />
      </PublicOnlyRoute>,
    ),
  },
  { path: '/s/:shareToken', element: deferred(<PublicNotePage />) },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/notes', element: deferred(<NotesPage />) },
      { path: '/notes/new', element: deferred(<NewNotePage />) },
      { path: '/notes/:noteId', element: deferred(<EditNotePage />) },
    ],
  },
  { path: '*', element: deferred(<NotFoundPage />) },
]);

export function App() {
  return <RouterProvider router={router} />;
}
