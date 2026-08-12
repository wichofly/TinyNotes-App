import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInPage, SignUpPage } from './AuthPages';

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
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, ...view };
}

function renderSignUpPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, ...view };
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
    authMocks.signInEmail.mockResolvedValue({
      data: null,
      error: { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' },
    });
    renderSignInPage();

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('distinguishes rate limiting from invalid credentials', async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({
      data: null,
      error: { status: 429, code: 'RATE_LIMITED' },
    });
    renderSignInPage();

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts from this device. Please wait a few minutes and try again.',
    );
  });

  it('reports when the authentication service is unreachable', async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockRejectedValue(new TypeError('Failed to fetch'));
    renderSignInPage();

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The authentication service is unavailable.',
    );
  });

  it('clears cached private data after successful authentication', async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ data: { user: {} }, error: null });
    const { client } = renderSignInPage();
    client.setQueryData(['notes'], { notes: [{ title: 'Another account note' }] });

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(client.getQueryData(['notes'])).toBeUndefined());
  });
});

describe('SignUpPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports an existing account specifically', async () => {
    const user = userEvent.setup();
    authMocks.signUpEmail.mockResolvedValue({
      data: null,
      error: { status: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' },
    });
    renderSignUpPage();

    await user.type(screen.getByLabelText('Name'), 'Reader');
    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists.',
    );
  });

  it('distinguishes rate limiting from duplicate accounts', async () => {
    const user = userEvent.setup();
    authMocks.signUpEmail.mockResolvedValue({
      data: null,
      error: { status: 429, code: 'RATE_LIMITED' },
    });
    renderSignUpPage();

    await user.type(screen.getByLabelText('Name'), 'Reader');
    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts from this device. Please wait a few minutes and try again.',
    );
  });

  it('reports an unavailable API or database without blaming the email address', async () => {
    const user = userEvent.setup();
    authMocks.signUpEmail.mockResolvedValue({
      data: null,
      error: { status: 500, code: 'INTERNAL_SERVER_ERROR' },
    });
    renderSignUpPage();

    await user.type(screen.getByLabelText('Name'), 'Reader');
    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-length');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The authentication service is unavailable.',
    );
  });
});
