# Quickstart: Validación de gestión de productos para alquiler

## Prerequisites

- Node.js 20+.
- Dependencias instaladas en `development/`.
- PostgreSQL de pruebas disponible con las variables de entorno del proyecto.
- Migraciones y seed aplicados.
- Un usuario de prueba identificado y una categoría activa.

## Setup

Desde la raíz del repositorio:

```bash
npm install --prefix development
docker compose -f development/docker-compose.yml build db
docker compose -f development/docker-compose.yml up -d db
npm --prefix development run db:generate
npm --prefix development run db:migrate
npm --prefix development run db:seed
```

## Automated validation

Ejecutar validadores, servicios y routers:

```bash
npm test
EMAIL_PROVIDER=console npm run test:integration
npm --prefix development run lint
npm run build
```

En PowerShell, sustituye el comando de integración por `$env:EMAIL_PROVIDER = "console"; npm run test:integration`.

Los contratos de tRPC a validar están en [contracts/listing-management.md](contracts/listing-management.md) y las entidades/reglas en [data-model.md](data-model.md).

## Manual/E2E scenarios

### 1. Acceso privado

1. Abrir `/dashboard/products` sin sesión.
2. Verificar redirección a login con callback de retorno.
3. Iniciar sesión con el usuario de prueba.
4. Verificar que el panel muestra únicamente productos propios.

### 2. Crear borrador y publicar

1. Pulsar `Crear producto`.
2. Intentar guardar sin título, categoría o precio válido.
3. Verificar errores junto a los campos y ausencia de un producto publicado.
4. Completar título, descripción, categoría, precio, ubicación aproximada y al menos una imagen válida.
5. Guardar como borrador y verificar que aparece como `draft`.
6. Publicar desde el detalle privado.
7. Verificar que el estado cambia a `published` y que el producto puede aparecer en la oferta pública.

### 3. Editar producto propio

1. Abrir un producto propio desde el panel.
2. Cambiar título y precio con valores válidos.
3. Guardar y verificar el mensaje de éxito.
4. Recargar y confirmar que el panel y el detalle muestran los valores nuevos.
5. Introducir un precio inválido.
6. Verificar que la validación impide guardar y que los valores anteriores permanecen.

### 4. Aislamiento por ownership

1. Crear un segundo usuario de prueba.
2. Intentar consultar, editar y retirar el `listingId` del primer usuario mediante el cliente de prueba.
3. Verificar que cada operación devuelve `NOT_FOUND` sin revelar si el recurso existe.

### 5. Retirada segura

1. Abrir la acción de eliminar/retirar un producto sin compromisos activos.
2. Cancelar la confirmación y verificar que no hay cambios.
3. Confirmar la retirada.
4. Verificar que desaparece de productos activos y de búsquedas públicas, pero el registro necesario para auditoría permanece.
5. Repetir con un producto que tenga un compromiso activo cuando el módulo de reservas esté disponible.
6. Verificar respuesta `CONFLICT` y ausencia de cambios destructivos.

### 6. Accesibilidad y estados

1. Ejecutar el flujo principal con teclado únicamente.
2. Verificar foco visible, labels de formularios, diálogo de confirmación y mensajes anunciables.
3. Comprobar estado vacío, skeleton de carga, error de validación y lista paginada.
4. Ejecutar axe-core sobre el panel y formulario.

## Expected outcomes

- Ninguna mutación privada funciona sin sesión.
- Ningún usuario puede leer o modificar productos ajenos.
- Los datos inválidos no crean ni alteran productos.
- Las mutaciones exitosas actualizan la lista sin mostrar datos obsoletos.
- La retirada elimina el producto de la oferta pública sin borrar compromisos ni auditoría.
