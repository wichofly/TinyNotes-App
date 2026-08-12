import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from '@tinynotes/shared';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Brand } from '../components/Brand';
import { authClient } from '../lib/auth-client';

type AuthOperation = 'sign-in' | 'sign-up';
type AuthResponseError = {
  code?: string | undefined;
  status: number;
};

const duplicateAccountCodes = new Set([
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
]);

function authErrorMessage(
  operation: AuthOperation,
  responseError: AuthResponseError | null | undefined,
  requestFailed: boolean,
): string | undefined {
  if (responseError?.status === 429) {
    return 'Too many attempts from this device. Please wait a few minutes and try again.';
  }

  if (requestFailed || (responseError && responseError.status >= 500)) {
    return 'The authentication service is unavailable. Check that the API and database are running, then try again.';
  }

  if (operation === 'sign-in' && responseError) {
    if (responseError.status === 401 || responseError.code === 'INVALID_EMAIL_OR_PASSWORD') {
      return 'Email or password is incorrect.';
    }
    return 'TinyNotes could not sign you in. Please try again.';
  }

  if (
    operation === 'sign-up' &&
    responseError?.code &&
    duplicateAccountCodes.has(responseError.code)
  ) {
    return 'An account with this email already exists.';
  }

  if (operation === 'sign-up' && responseError) {
    return 'TinyNotes could not create your account. Please try again.';
  }

  return undefined;
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh bg-paper lg:grid-cols-[1fr_0.8fr]">
      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Brand />
          <Link to="/" className="btn-ghost">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <h1 className="font-serif text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-stone-600">{subtitle}</p>
          {children}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-stone-900 lg:block" aria-hidden="true">
        <div className="absolute -right-28 -top-24 size-96 rounded-full bg-amber-300/90 blur-sm" />
        <div className="absolute -bottom-32 -left-32 size-112 rounded-full border-[5rem] border-stone-700" />
        <blockquote className="absolute bottom-20 left-14 right-14 font-serif text-3xl font-bold leading-tight text-stone-100">
          “The palest ink is better than the best memory.”
          <footer className="mt-4 font-sans text-sm font-normal text-stone-400">
            — Chinese proverb
          </footer>
        </blockquote>
      </aside>
    </main>
  );
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        {...props}
        id={id}
        className="input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const signInMutation = useMutation({
    mutationFn: (values: SignInInput) => authClient.signIn.email(values),
  });
  const from = (location.state as { from?: string } | null)?.from;
  const destination = from?.startsWith('/') && !from.startsWith('//') ? from : '/notes';
  const serverErrorMessage = authErrorMessage(
    'sign-in',
    signInMutation.data?.error,
    signInMutation.isError,
  );

  async function submit(values: SignInInput) {
    try {
      const result = await signInMutation.mutateAsync(values);
      if (result.error) return;
      queryClient.clear();
      navigate(destination, { replace: true });
    } catch {
      // TanStack Query exposes the request error through signInMutation.isError.
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in and pick up where you left off.">
      <form onSubmit={handleSubmit(submit)} className="mt-9 space-y-5">
        <Field
          label="Email address"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />
        {serverErrorMessage ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {serverErrorMessage}
          </p>
        ) : null}
        <button className="btn-primary w-full py-3" disabled={signInMutation.isPending}>
          {signInMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {signInMutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        New to TinyNotes?{' '}
        <Link
          to="/sign-up"
          className="font-semibold text-stone-900 underline decoration-amber-400 decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignUpPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const signUpMutation = useMutation({
    mutationFn: (values: SignUpInput) => authClient.signUp.email(values),
  });
  const serverErrorMessage = authErrorMessage(
    'sign-up',
    signUpMutation.data?.error,
    signUpMutation.isError,
  );

  async function submit(values: SignUpInput) {
    try {
      const result = await signUpMutation.mutateAsync(values);
      if (result.error) return;
      queryClient.clear();
      navigate('/notes', { replace: true });
    } catch {
      // TanStack Query exposes the request error through signUpMutation.isError.
    }
  }

  return (
    <AuthShell
      title="Make space to think"
      subtitle="Create your private notebook in a few seconds."
    >
      <form onSubmit={handleSubmit(submit)} className="mt-9 space-y-5">
        <Field
          label="Name"
          type="text"
          autoComplete="name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Field
          label="Email address"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />
        <p className="text-xs leading-5 text-stone-500">
          Use 8–128 characters. No arbitrary symbol or uppercase rules.
        </p>
        {serverErrorMessage ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {serverErrorMessage}
          </p>
        ) : null}
        <button className="btn-primary w-full py-3" disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {signUpMutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link
          to="/sign-in"
          className="font-semibold text-stone-900 underline decoration-amber-400 decoration-2 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
