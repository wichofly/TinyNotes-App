import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInPage } from './AuthPages';

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock('../lib/auth-client', () => ({
  authClient: {
    signIn: { email: authMocks.signInEmail },
    signUp: { email: authMocks.signUpEmail },
  },
}));

function renderSignInPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignInPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('associates validation errors with invalid fields', async () => {
    const user = userEvent.setup();
    renderSignInPage();

    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders authentication failures from the mutation state', async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ data: null, error: { message: 'Invalid login' } });
    renderSignInPage();

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });
});
