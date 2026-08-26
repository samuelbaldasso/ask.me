export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-surface-dim/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 px-4 py-6 text-center text-xs text-foreground/50 sm:px-6">
        <span className="text-sm font-bold text-foreground/70">ask.me</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <a href="/how-to-use.html" className="transition hover:text-foreground/80">
            Como usar
          </a>
          <span>·</span>
          <a href="/privacy-policy.html" className="transition hover:text-foreground/80">
            Política de privacidade
          </a>
          <span>·</span>
          <a href="/terms-of-use.html" className="transition hover:text-foreground/80">
            Termos de uso
          </a>
          <span>·</span>
          <span>
            Email de contato:{" "}
            <a
              href="mailto:baldassosamuel93@gmail.com"
              className="transition hover:text-foreground/80"
            >
              baldassosamuel93@gmail.com
            </a>
          </span>
          <span>·</span>
          <span>© {new Date().getFullYear()} ask.me</span>
        </div>
        <span>Operado em Macaé, Rio de Janeiro - Brasil</span>
      </div>
    </footer>
  );
}
