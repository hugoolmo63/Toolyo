import type { OwnerDTO } from "@/types/listing-detail";
import Link from "next/link";
import Image from "next/image";

/**
 * OwnerCard — perfil público del arrendador.
 * Solo campos públicos: nombre, avatar, badge verificado, rating, tiempo de respuesta,
 * número de transacciones. Los campos no disponibles se muestran como "N/A" hasta §1.2.
 * Nunca email, teléfono ni datos privados. Ver spec.md FR-010.
 */
interface OwnerCardProps {
  owner: OwnerDTO;
}

export function OwnerCard({ owner }: OwnerCardProps) {
  const displayName = owner.displayName ?? "Usuario";

  return (
    <section className="owner-card" aria-labelledby="owner-heading">
      <div className="owner-card-body">
        <Link href={`/users/${owner.id}`} className="owner-avatar" aria-label={`Ver perfil de ${displayName}`}>
          {owner.avatarUrl ? (
            <Image
              src={owner.avatarUrl}
              alt={displayName}
              width={64}
              height={64}
              unoptimized
            />
          ) : (
            <div className="owner-avatar-placeholder" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="owner-info">
          <p className="owner-name" id="owner-heading">
            <Link href={`/users/${owner.id}`}>{displayName}</Link>
            {owner.isVerified && (
              <span className="owner-verified-badge" title="Identidad verificada">
                {" "}✓
              </span>
            )}
          </p>
          <dl className="owner-stats">
            <div className="owner-stat">
              <dt>Valoración</dt>
              <dd>
                {owner.ratingAverage !== null
                  ? `★ ${owner.ratingAverage.toFixed(1)}`
                  : "N/A"}
              </dd>
            </div>
            <div className="owner-stat">
              <dt>Tiempo de respuesta</dt>
              <dd>
                {owner.responseTimeHours !== null
                  ? `${owner.responseTimeHours}h`
                  : "N/A"}
              </dd>
            </div>
            <div className="owner-stat">
              <dt>Transacciones</dt>
              <dd>
                {owner.transactionCount !== null
                  ? owner.transactionCount
                  : "N/A"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
