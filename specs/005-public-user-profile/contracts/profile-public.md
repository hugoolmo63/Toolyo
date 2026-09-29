# Contrato público: `/users/[id]`

## Entrada

- Ruta dinámica: `id` del usuario.
- No requiere sesión.

## Respuesta de datos para presentación

```ts
type PublicUserProfileDTO = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  ratingAverage: number | null;
  transactionCount: number;
  badges: {
    registered: boolean;
    verified: boolean;
    superLessor: boolean;
  };
  approximateLocation: { lat: number; lng: number } | null;
  listings: PublicListingCard[];
  reviews: PublicReview[];
};
```

La proyección nunca incluye email, teléfono, `emailNormalized`, sesiones, credenciales, KYC, eventos de seguridad, dirección exacta o coordenadas con precisión superior a la necesaria para dibujar la zona pública.

## Comportamiento HTTP/UI

- Usuario activo: render de cabecera, badges, contacto, mapa opcional, listings y reseñas.
- Usuario inexistente/inactivo/eliminado: `notFound()`/404 sin detalle del motivo interno.
- Sin ubicación: estado vacío u omisión accesible del mapa.
- Sin listings: estado vacío; no error.
- Sin reviews: “Aún no hay reseñas” u otro estado equivalente.
- Contactar sin sesión: redirige a autenticación conservando callback seguro al flujo de contacto.

## Componentes

- `UserProfileHeader`: identidad, fecha, rating, transacciones y CTA Contactar.
- `UserProfileBadges`: badges derivados; no acepta permisos desde props no verificadas.
- `UserProfileLocationMap`: mapa cliente con círculo de 750 m y fallback sin filtrar coordenadas.
- `UserProfileListings`: grid de `ListingCard` y estado vacío.
- `UserProfileReviews`: lista ordenada de reseñas o estado vacío.
- `app/users/[id]/page.tsx`: carga DTO en servidor, llama `notFound()` y compone componentes.