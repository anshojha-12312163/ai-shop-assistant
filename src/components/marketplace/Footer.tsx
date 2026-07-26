export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6 bg-secondary/50 mt-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-sm font-bold tracking-widest uppercase opacity-40">Synthetix &copy; 2026</span>
        <p className="text-xs text-muted-foreground max-w-md text-center">
          The marketplace that shops and sells with you, not just for you.
        </p>
        <div className="flex gap-8 text-xs font-mono uppercase tracking-tight text-muted-foreground">
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">AI Ethics</a>
        </div>
      </div>
    </footer>
  );
}
