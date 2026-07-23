import Link from 'next/link';

const links = [
  { href: '/', label: 'Buscar' },
  { href: '/ask', label: 'Perguntar' },
  { href: '/favorites', label: 'Favoritos' },
  { href: '/subscription', label: 'Assinatura' },
];

export function NavBar() {
  return (
    <header className="bg-gradient-to-br from-primary to-[#a855f7] text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          ask.me
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="opacity-90 transition hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-2 text-primary opacity-100 hover:opacity-90"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
