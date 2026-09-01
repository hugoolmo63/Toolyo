/**
 * RulesSection — reglas del arrendador con defaults.
 * Política de cancelación "Flexible" y horarios genéricos hasta que la feature
 * de listings §2 introduzca campos configurables. Ver spec.md FR-013.
 */
export function RulesSection() {
  return (
    <section className="rules-section" aria-labelledby="rules-heading">
      <h2 id="rules-heading">Normas y condiciones</h2>
      <dl className="rules-list">
        <div className="rule-item">
          <dt>Política de cancelación</dt>
          <dd>
            <p>Flexible — Reembolso 100% hasta 24h antes de la recogida.</p>
            <p className="rule-default-note">
              Valor por defecto. La política final puede variar al confirmar la reserva.
            </p>
          </dd>
        </div>
        <div className="rule-item">
          <dt>Horarios de recogida y devolución</dt>
          <dd>
            <p>Recogida y devolución acordadas con el arrendador tras confirmar la reserva.</p>
            <p className="rule-default-note">
              Valor por defecto. Los horarios específicos se acuerdan al confirmar.
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}
