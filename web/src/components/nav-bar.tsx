'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

const links = [
  { href: '/buscar', label: 'Buscar' },
  { href: '/ask', label: 'Perguntar' },
  { href: '/favorites', label: 'Favoritos' },
  { href: '/anuncie', label: 'Para empresas' },
];

export function NavBar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Trava o scroll do body enquanto o menu mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  const navLinks = user?.isAdmin ? [...links, { href: '/admin', label: 'Admin' }] : links;

  const renderAuthAction = (onNavigate?: () => void) =>
    isAuthenticated ? (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut();
        }}
        className="w-full rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-primary transition hover:opacity-90 sm:w-auto"
        title={user?.email ?? undefined}
      >
        Sair{user?.name ? ` (${user.name.split(' ')[0]})` : ''}
      </button>
    ) : (
      <Link
        href="/login"
        onClick={onNavigate}
        className="block w-full rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-primary transition hover:opacity-90 sm:w-auto"
      >
        Entrar
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-br from-primary to-[#a855f7]/95 text-white shadow-[0_4px_20px_rgba(124,58,237,0.18)] backdrop-blur supports-[backdrop-filter]:bg-primary/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/sobre"
          className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight"
          onClick={() => setMenuOpen(false)}
        >
          <span aria-hidden>📍</span>
          ask.me
        </Link>

        <nav className="hidden items-center gap-x-6 text-sm font-semibold sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-1 transition hover:opacity-100 ${
                isActive(link.href) ? 'opacity-100' : 'opacity-80'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-white" />
              )}
            </Link>
          ))}
          {renderAuthAction()}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 sm:hidden"
        >
          <span className="relative block h-4 w-5" aria-hidden>
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-white transition-all ${
                menuOpen ? 'top-[7px] rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] block h-0.5 w-5 rounded-full bg-white transition-opacity ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-white transition-all ${
                menuOpen ? 'top-[7px] -rotate-45' : 'top-[14px]'
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out sm:hidden ${
          menuOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col gap-1 border-t border-white/15 px-4 pb-4 pt-2 text-base font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-xl px-3 py-2.5 transition ${
                isActive(link.href) ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2">{renderAuthAction(() => setMenuOpen(false))}</div>
        </nav>
      </div>
    </header>
  );
}
