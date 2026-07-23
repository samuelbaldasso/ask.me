'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

const links = [
  { href: '/', label: 'Buscar' },
  { href: '/ask', label: 'Perguntar' },
  { href: '/favorites', label: 'Favoritos' },
  { href: '/subscription', label: 'Assinatura' },
];

export function NavBar() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <header className="bg-gradient-to-br from-primary to-[#a855f7] text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          ask.me
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold sm:gap-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="opacity-90 transition hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full bg-white px-4 py-2 text-primary hover:opacity-90"
              title={user?.email ?? undefined}
            >
              Sair{user?.name ? ` (${user.name.split(' ')[0]})` : ''}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2 text-primary hover:opacity-90"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
