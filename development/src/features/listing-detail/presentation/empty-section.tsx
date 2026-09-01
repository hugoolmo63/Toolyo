/**
 * EmptySection — estado vacío genérico para secciones sin datos.
 * Mensaje útil y (opcional) sugerencia. Ver FRONTEND.md §6.3.
 */
interface EmptySectionProps {
  title: string;
  message: string;
  suggestion?: string;
}

export function EmptySection({ title, message, suggestion }: EmptySectionProps) {
  return (
    <section className="empty-section" aria-labelledby={`empty-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <h2 id={`empty-${title.toLowerCase().replace(/\s/g, "-")}`}>{title}</h2>
      <p className="empty-message">{message}</p>
      {suggestion && <p className="empty-suggestion">{suggestion}</p>}
    </section>
  );
}
