# Constitución Frontend — Toolyo

> **Versión:** 1.0  
> **Alcance:** Web App (Next.js App Router), Admin Dashboard y capa mobile-web.  
> **Base:** Arquitectura definida en `docs/03-arquitectura-y-tech-stack.md`.  
> **Complemento obligatorio:** `constitution/DESIGN.md` (tokens visuales y accesibilidad).

---

## 1. Principios Rectores

1. **Server-first.** Usar React Server Components (RSC) por defecto. Client Components solo cuando se requiera interactividad, efectos secundarios o acceso a APIs del navegador.
2. **Type-safety end-to-end.** El frontend consume la API a través de tRPC + React Query; todo contrato debe ser inferido, nunca re-declarado.
3. **UI como función de estado.** Los componentes reciben props inmutables y derivan la UI sin side effects locales ocultos.
4. **Optimización progresiva.** Medir antes de optimizar. Las reglas de performance (lazy loading, memoización) son obligatorias solo cuando el perfilado lo justifica, salvo excepciones definidas aquí.
5. **Accesibilidad no negociable.** Todo componente interactivo debe ser usable con teclado y lector de pantalla. Ver `DESIGN.md` §7.
6. **Sin acceso directo a datos.** El navegador nunca consulta la base de datos ni instancia Prisma; los Client Components reciben datos ya resueltos por Server Components, tRPC o route handlers del servidor.

---

## 2. Organización del Código

### 2.1 Estructura de carpetas (App Router)

```
app/
  (marketing)/            # Route groups sin layout compartido con app
  (app)/
    layout.tsx
    page.tsx
    listings/
      page.tsx
      [slug]/
        page.tsx
        loading.tsx       # Skeleton obligatorio para rutas dinámicas
        error.tsx         # Error boundary de ruta
    api/                  # Solo si se requieren route handlers puros
  components/
    ui/                   # shadcn/ui base (no modificar estilos base)
    forms/                # Formularios completos (composición de campos)
    layout/               # Shell (header, sidebar, footer)
    shared/               # Componentes transversales reutilizables
  hooks/
    use-*.ts              # Custom hooks puros; nunca llamen a tRPC directamente
  lib/
    trpc.ts               # Cliente tRPC (server + client)
    utils.ts              # Helpers puros (cn, formatters, etc.)
    validations/          # Schemas Zod compartidos con backend
  providers/
    app-providers.tsx     # Compose de contextos del cliente
  stores/
    *.store.ts            # Zustand stores; un dominio por archivo
  styles/
    globals.css           # Tailwind directives + variables de tema
  types/
    *.ts                  # Tipos globales puramente de presentación
```

### 2.2 Reglas de ubicación

- **Colocar lo cerca de donde se usa.** Si un componente solo se usa en `listings/[slug]`, vivirá junto a su `page.tsx`, no en `components/shared`.
- **No crear carpetas `common`, `misc` ni `helpers` genéricas.** Son basureros inevitables.
- **Separar `lib` de `utils`.** `lib` inicializa dependencias externas (tRPC, Prisma client); `utils` contiene funciones puras sin side effects.

---

## 3. Estilo de Código

### 3.1 TypeScript

- **Estricto absoluto:** `strict: true`, `noUncheckedIndexedAccess: true` si el proyecto lo tolera.
- **No usar `any`.** Usar `unknown` + type guards o generics con bounds.
- **Inferencia preferida.** No tipar manualmente lo que TypeScript infiere sin pérdida de legibilidad.
- **Enums vs Union Types.** Preferir union types de strings (`type Status = 'active' | 'inactive'`) sobre `enum`.

### 3.2 Naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes | PascalCase | `BookingCard` |
| Hooks | camelCase con prefijo `use` | `useGeolocation` |
| Stores Zustand | camelCase con sufijo `Store` | `bookingStore` |
| Funciones helpers | camelCase | `formatCurrency` |
| Constantes | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Archivos de ruta Next.js | kebab-case | `error.tsx`, `opengraph-image.tsx` |

### 3.3 Exports

- Preferir `export default` solo en páginas, layouts y route handlers.
- Para todo lo demás, usar named exports. Facilita el tree-shaking y el autocompletado.

---

## 4. Componentes

### 4.1 Server Components por defecto

- Todo archivo bajo `app/` es un Server Component salvo que se use la directiva `"use client"`.
- **Llamadas a tRPC desde el servidor:** usar `api.listings.getBySlug.query()` directamente en el Server Component (vía RSC helper). No levantar un provider de cliente innecesario.
- **Datos sensibles y persistencia:** cualquier lectura o escritura de base de datos se hace en el servidor. El frontend solo envía intents, inputs y acciones, nunca queries directas a la DB.

### 4.2 Client Components

- Limitar a: interacción directa del usuario, hooks de browser, contextos de cliente, animaciones que requieran `useEffect`.
- Encapsular la lógica cliente en hooks y dejar el JSX lo más declarativo posible.

### 4.3 Composición sobre configuración

- Evitar componentes con 10 props booleanas. Preferir composición de subcomponentes:
  ```tsx
  <Card>
    <Card.Header>…</Card.Header>
    <Card.Body>…</Card.Body>
  </Card>
  ```
- Los componentes de `shadcn/ui` ya están diseñados así; mantener el patrón.

### 4.4 Slots y `children`

- Usar `children` para inyectar contenido variante; usar `React.ReactNode` como tipo.
- Evitar `React.ReactElement` a menos que se requiera un único elemento.

---

## 5. Manejo de Estado

### 5.1 Estado del servidor

- **Fuente de verdad:** React Query (TanStack Query) vía tRPC.
- **No cachear manualmente** en Zustand lo que ya cachea React Query.
- **Invalidación declarativa:** usar `utils.api.listings.invalidate()` tras mutaciones; no realizar refetchs imperativos salvo caso justificado.
- **Prefetching:** en Server Components o en `useEffect` de navegación, precargar datos de rutas probables.

### 5.2 Estado local del cliente

- **Zustand** para estado global realmente transversal (autenticación, preferencias de UI, carrito).
- **Un store por dominio.** No un store monolítico.
- **No persistir en `localStorage` datos sensibles** ni tokens de sesión; dejar eso a cookies `HttpOnly`.

### 5.3 Estado de formularios

- **React Hook Form** para todo formulario con más de un campo.
- **Zod** como resolver; el schema debe importarse desde `lib/validations/` (compartido con backend si es posible).
- **UI de error:** mostrar errores de campo al tocar (`onBlur`) y al intentar enviar; nunca silenciar validaciones.

---

## 6. Fetching de Datos

### 6.1 tRPC

- Llamadas en Server Components: `const data = await api.listings.getBySlug.query({ slug })`.
- Llamadas en Client Components: `const { data } = api.listings.getBySlug.useQuery({ slug })`.
- Mutaciones: usar el patrón `onSuccess` para invalidar queries relacionadas y mostrar toasts de éxito/error.

### 6.2 Route Handlers (`app/api/*`)

- Solo para webhooks de terceros (Stripe, etc.) o endpoints que deban ser llamados fuera del ecosistema tRPC.
- Mantenerlos delgados: validar con Zod, delegar a una función de servicio, devolver respuesta.

### 6.3 Loading y Error states

- Toda ruta dinámica debe proveer `loading.tsx` (Server Components) o usar `Suspense` con un `fallback` explícito.
- Errores de ruta: `error.tsx` con boundary de React; errores de mutation: toast + rollback optimista si aplica.

---

## 7. UI, Estilos y Tokens

- **Tailwind CSS** como único sistema de estilos. No CSS-in-JS en Client Components salvo excepción justificada.
- **Tokens de `DESIGN.md` obligatorios.** Ningún color hardcodeado; usar las variables CSS o las clases utilitarias mapeadas.
- **shadcn/ui** como base de componentes. Personalizar vía `className` o extendiendo el componente localmente; no modificar la instalación base para no romper actualizaciones.
- **Responsive mobile-first.** Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`. Diseñar siempre primero para móvil.

---

## 8. Accesibilidad (A11y)

- Cumplir `DESIGN.md` §7 como mínimo.
- Usar etiquetas semánticas (`<nav>`, `<main>`, `<section>`) y roles ARIA solo cuando el HTML no sea suficiente.
- **Focus trapping** en modales y drawers.
- **Alt text** obligatorio en imágenes funcionales; decorativas con `alt=""`.
- **Labels** explícitos en inputs (`<label>` con `htmlFor` o `aria-label` justificado).

---

## 9. Performance

### 9.1 Imágenes

- Usar siempre `next/image` (o el equivalente de React Native optimizado) con `priority` solo para LCP.
- Formatos: servir WebP/AVIF; el CDN (Imgix/Cloudinary) debe encargarse de la conversión.
- Tamaños: proveer `sizes` para evitar descargas innecesarias.

### 9.2 Code splitting

- Las páginas se code-splitan automáticamente por Next.js.
- Componentes pesados del cliente (>100 KB parseados) deben cargarse con `next/dynamic`.

### 9.3 Fonts

- Usar `next/font` para cargar Inter (o la fuente del tema) con `display: swap` y `subsets` optimizados.

### 9.4 Rerenders

- No anticipar problemas de render. Si un componente causa problemas, usar `React.memo` en hojas del árbol, nunca en contenedores de alto nivel que reciban objetos no memoizados.

---

## 10. Routing y Navegación

- Usar `next/link` para navegación interna; nunca `<a href>` para rutas propias.
- Parámetros de búsqueda: usar `nuqs` o helper equivalente para mantener la URL como fuente de verdad de filtros.
- **Route groups** (`(app)`, `(marketing)`) para compartir layouts sin afectar el path.

---

## 11. Tests

(Ver también `constitution/TESTING.md`)

- **Unitarios:** Vitest + React Testing Library. Testear lógica de hooks y helpers; no testear detalles de implementación de componentes.
- **E2E:** Playwright. Cubrir los flujos críticos de negocio (búsqueda → reserva → pago).
- **A11y:** ejecutar `axe-core` en CI para cada página estática.

---

## 12. Checklist de Revisión de Código Frontend

Antes de abrir un PR:

- [ ] No hay `any` implícitos ni explícitos.
- [ ] Los Server Components no importan librerías de cliente innecesariamente.
- [ ] Los Zod schemas se reutilizan o comparten con backend.
- [ ] No hay colores hardcodeados fuera de `DESIGN.md`.
- [ ] Toda ruta dinámica tiene `loading.tsx` o `Suspense`.
- [ ] Las mutaciones invalidan las queries afectadas.
- [ ] Los formularios usan React Hook Form + Zod.
- [ ] Los tests pasan y la cobertura no baja del umbral definido.

---

*Documento mantenido por el equipo de Frontend de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@frontend-lead`.*
