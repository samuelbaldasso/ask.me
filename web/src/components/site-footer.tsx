export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-surface-dim/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 px-4 py-6 text-center text-xs text-foreground/50 sm:px-6">
        <span className="text-sm font-bold text-foreground/70">ask.me</span>
        <div>
          <a href="/privacy-policy.html" className="transition hover:text-foreground/80">
            Política de privacidade
          </a>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} ask.me</span>
        </div>
      </div>
    </footer>
  );
}
