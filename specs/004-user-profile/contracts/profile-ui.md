# Contrato de interfaz: Perfil de Usuario

## `GET /users/[id]` — vista pública

La vista debe renderizar una proyección equivalente a `PublicProfileView`:

```text
{
  id,
  avatarUrl,
  displayName,
  bio,
  rating,
  transactionCount,
  badges: { verified, quickResponse },
  activeListings: [{ id, slug, title, coverImageUrl, pricePerDay }]
}
```

No debe incluir email, teléfono, ubicación preferida, credenciales, sesión, KYC ni eventos de seguridad. Usuario inexistente/inactivo: 404 o estado público no disponible.

## `GET /profile` — formulario privado

Requiere sesión válida. El formulario carga `avatarUrl`, `displayName`, `bio` y `preferredLocation` del usuario de la sesión; no acepta un `userId` como autoridad.

## Acción/router de actualización

Entrada validada en servidor:

```text
{
  avatarUrl?: string | null,
  displayName?: string | null,
  bio?: string | null,
  preferredLocation?: string | null
}
```

Resultado exitoso: proyección editable actualizada, sin secretos. Sin sesión: 401. Sesión inválida para el recurso: 403. Error de validación: 400 y ningún cambio persistido.