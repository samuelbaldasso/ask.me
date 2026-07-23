export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-foreground/50 sm:px-6">
      <a href="/privacy-policy.html" className="hover:text-foreground/80">
        Política de privacidade
      </a>
      <span className="mx-2">·</span>
      <span>© {new Date().getFullYear()} ask.me</span>
    </footer>
  );
}
