# Wireframe Navegable — Toolyo

> Maqueta interactiva de baja/media fidelidad para navegar por todos los flujos de la aplicación.

---

## Cómo usar

1. Abre `index.html` en cualquier navegador moderno (doble clic o servidor local).
2. Navega por la aplicación como si fueras un usuario real.
3. Usa los botones, enlaces y formularios para moverte entre pantallas.

---

## Flujos cubiertos

### 🏠 Visitante (sin login)
- **Landing** → Explorar → Resultados → Detalle de producto
- Desde Detalle se puede intentar Reservar o Contactar, lo que redirige a Login
- Login → Registro → Onboarding → Dashboard

### 🔍 Arrendatario (quien alquila)
- Landing / Explorar → Búsqueda con filtros → Resultados (grid + mapa)
- Resultados → Detalle de producto
- Detalle → Galería, reviews, calendario, perfil arrendador
- Detalle → Checkout (fechas, pago, seguro) → Confirmación de reserva
- Confirmación → Chat con arrendador
- Detalle → Perfil público del arrendador

### 📢 Arrendador (quien publica)
- Dashboard → Métricas, próximas reservas, acceso rápido
- Mis Anuncios → Listado con estados (Publicado, En revisión)
- Nuevo Anuncio → Wizard de 4 pasos: Categoría → Fotos → Precios → Ubicación
- Calendario → Vista mensual con reservas, bloqueo de fechas
- Reservas → Tabla con estados, aprobar/rechazar
- Ingresos → Gráfico + historial de transacciones
- Mensajes → Lista de conversaciones
- Chat → Conversación en tiempo real simulada
- Ajustes → Datos personales, notificaciones, métodos de pago, cuenta bancaria

### 👤 Perfil
- Perfil propio → Editar, ver anuncios y reviews
- Perfil público de arrendador → Contactar, ver anuncios

### 🛡️ Admin
- Panel admin → Estadísticas, listings en revisión, KYC pendiente, disputas, usuarios

### ❓ Ayuda
- Centro de ayuda → FAQ con búsqueda

---

## Estados simulados

| Estado | Descripción |
|--------|-------------|
| No logueado | Muestra barra pública con Login/Registro. Oculta sidebar. |
| Logueado | Muestra barra de autenticado (María), sidebar en dashboard. |
| Admin | Si se activa `isAdmin = true` en consola, aparece link a Admin. |

---

## Trucos de navegación

- Para simular login rápido: pulsa "Iniciar sesión" en la pantalla de Login (rellena credenciales dummy).
- Para simular admin: abre consola del navegador y ejecuta `isAdmin = true; go('dashboard');`
- Los toasts muestran feedback de acciones (reserva aprobada, mensaje enviado...)

---

## Estructura del archivo

Es una **SPA en un solo HTML** que usa CSS puro y JavaScript vanilla. No requiere build ni dependencias externas (salvo la fuente Inter de Google Fonts).

Cada pantalla es un `<section class="screen" id="...">`. La función `go(id)` muestra/oculta pantallas y actualiza la navegación contextual (topbar, sidebar).

---

## Decisiones de diseño

- Paleta, tipografía, espaciado y componentes basados en `constitution/DESIGN.md` (tema **profesional-seguro**).
- Las imágenes son placeholders wireframe (rectángulos punteados grises).
- Las transiciones entre pantallas usan `fadeIn` suave (250ms ease-out).
- Responsive básico: grid de 4→3→2 columnas, sidebar oculto en móvil.

---

*Generado para el proyecto Toolyo — Plataforma de alquiler P2P*
