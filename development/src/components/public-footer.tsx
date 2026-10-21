import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <span>© {new Date().getFullYear()} Toolyo</span>
      <nav aria-label="Información legal">
        <Link href="/terms">Términos y Condiciones</Link>
        <Link href="/privacy">Política de Privacidad</Link>
      </nav>
    </footer>
  );
}