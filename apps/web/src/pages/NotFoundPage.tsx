import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Brand } from '../components/Brand';

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-5">
      <div className="text-center">
        <Brand linked={false} />
        <p className="mt-12 font-serif text-8xl font-bold text-amber-300">404</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">This page wandered off</h1>
        <p className="mt-3 text-stone-500">There is nothing written here.</p>
        <Link to="/" className="btn-primary mt-8">
          <ArrowLeft className="size-4" /> Back home
        </Link>
      </div>
    </main>
  );
}
