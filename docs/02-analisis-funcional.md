# Análisis Funcional — Extracción desde Hygglo.dk

## 1. Entidades Principales del Sistema

A partir del análisis del payload JSON de Hygglo, se identifican las siguientes entidades clave:

### 1.1 Usuario (User / Owner)
```json
{
  "id": 12435885,
  "profileImage": { "fullSizeUrl": "...", "thumbnailUrl": "..." },
  "badges": { "fastResponder": true },
  "rating": 5,
  "currency": "DKK"
}
```
- **Perfil público**: foto, nombre, rating promedio.
- **Badges**: "fastResponder" (responde rápido), "verificado" (KYC completado), "superarrendador" (alta reputación + verificación). Los badges de verificación son visibles en perfil, tarjetas de listing y chat.
- **Rating**: escala 1-5 basada en reviews post-alquiler.
- **Moneda**: DKK por defecto (en España sería EUR).

### 1.2 Producto (Product)
```json
{
  "id": 118630,
  "name": "Softicemaskine",
  "badges": { "new": false, "popular": true, "veryPopular": true, "label": "Meget populær" },
  "stats": { "averageRating": 5, "completedOrders": 16 },
  "category": { "id": 8437, "name": "Is- og slushicemaskine", "slug": "...", "insuranceInfo": "..." },
  "images": [{ "id": ..., "thumbnailUrl": "...", "fullSizeUrl": "..." }],
  "prices": [
    { "days": 1, "pricePerDay": 850, "price": 850, "label": "850 kr" },
    { "days": 3, "pricePerDay": 500, "price": 1500, "label": "1.500 kr" },
    { "days": 7, "pricePerDay": 300, "price": 2100, "label": "2.100 kr" }
  ],
  "highestPricePerDay": 850,
  "lowestPricePerDay": 300,
  "priceRange": { "label": "300 - 850 kr/dag" },
  "minimumRentalDays": 1
}
```
- **Badges dinámicos**: nuevo, popular, muy popular (basado en algoritmo de demanda/reservas).
- **Estadísticas**: rating promedio y órdenes completadas.
- **Categoría jerárquica**: con información específica de seguro por categoría.
- **Galería de imágenes**: múltiples fotos con thumbnails y full-size (servidas por Imgix).
- **Pricing escalonado**: descuento por volumen (1 día, 3 días, 7 días). El precio por día decrece cuanto más tiempo se alquila.
- **Restricciones**: mínimo de días de alquiler.

### 1.3 Listing / Publicación de Alquiler
```json
{
  "slug": "7cc-softicemaskine",
  "publicUrl": "https://www.hygglo.dk/i/7cc-softicemaskine",
  "createdAt": "2022-01-19T09:08:24.110Z",
  "updatedAt": "2022-01-19T09:08:24.110Z",
  "location": {
    "bestLocation": {
      "name": "Frederiksborg Slotssogn",
      "parentName": "Hillerød, Hillerød",
      "slug": "frederiksborg-slotssogn",
      "preposition": "i",
      "position": { "type": "Point", "coordinates": [12.285, 55.926] }
    }
  },
  "distance": null,
  "isFavorite": null
}
```
- **URL semántica**: slug único para SEO y compartir.
- **Geolocalización precisa**: coordenadas GPS + jerarquía administrativa (zona, municipio, región).
- **Distancia**: calculada desde la ubicación del usuario (null si no hay permiso de geo).
- **Favoritos**: marcador por usuario.

### 1.4 Categoría (Category)
```json
{
  "id": 8437,
  "name": "Is- og slushicemaskine",
  "slug": "8437-is-og-slushicemaskine",
  "insuranceInfo": "Skader er forsikret uden selvrisiko.",
  "showInNavigation": true,
  "reviews": { "averageProductRating": 4.9, "numberOfProductReviews": 65 }
}
```
- **Seguro específico por categoría**: algunas categorías tienen franquicia (ej. trailers: 1.000 kr), otras no.
- **Visibilidad en navegación**: flag para mostrar en menú principal.
- **Reviews agregadas**: rating promedio de todos los productos de la categoría.

---

## 2. Flujos de Usuario Principales

### 2.1 Flujo de Descubrimiento (Arrendatario)
1. **Landing**: Hero visual con búsqueda por ubicación y categoría.
2. **Home**: Grid de productos destacados ("latestProducts", "popularNearYou").
3. **Búsqueda**: Filtros por ubicación, categoría, rango de fechas, precio máximo.
4. **Listado**: Tarjetas con imagen, nombre, precio por día, badge, distancia, rating.
5. **Detalle de Producto**: Galería, descripción, calendario de disponibilidad, perfil del arrendador, precios escalonados, botón de reserva.
6. **Checkout**: Selección de fechas, resumen de precios, pago, confirmación.

### 2.2 Flujo de Publicación (Arrendador)
1. **Onboarding**: Registro con email y verificación de teléfono. KYC opcional (DNI + selfie) para obtener badge "Verificado".
2. **Crear Listing** (disponible para todos, verificados o no):
   - Seleccionar categoría.
   - Subir fotos (múltiples, con cropping).
   - Título y descripción.
   - Configurar precios escalonados (1 día, 3 días, 7 días + personalizado).
   - Establecer mínimo de días.
   - Definir ubicación de recogida (mapa interactivo).
   - Configurar calendario de disponibilidad (bloquear fechas).
3. **Publicar**: El listing pasa a estado "publicado" y aparece en búsquedas. Los listings de usuarios no verificados muestran aviso contextual de ausencia de seguro.
4. **Gestión**: Dashboard con solicitudes de alquiler, calendario, ingresos, mensajes.

### 2.3 Flujo de Alquiler (Transacción)
1. **Solicitud de reserva**: El arrendatario selecciona fechas y envía solicitud.
2. **Aprobación/Rechazo**: El arrendador tiene X horas para responder (auto-rechazo si no).
3. **Pago**: El arrendatario paga el importe total + comisión de plataforma.
4. **Recogida**: Intercambio físico del bien (checklist opcional de estado).
5. **Devolución**: El arrendatario devuelve el bien en la fecha acordada.
6. **Review mutuo**: Ambas partes valoran la experiencia (sistema de doble review).
7. **Liberación de fondos**: El arrendador recibe el pago (menos comisión) en su cuenta.

---

## 3. Funcionalidades Clave Identificadas

### 3.1 Sistema de Búsqueda y Descubrimiento
- **Búsqueda geolocalizada**: Por coordenadas actuales o por texto (municipio/zona).
- **Autocompletado de ubicaciones**: Con jerarquía administrativa.
- **Filtros**: Categoría, rango de fechas, precio máximo, distancia máxima.
- **Ordenación**: Relevancia, distancia, precio (asc/desc), rating.
- **Badges algorítmicos**: "Nuevo", "Popular", "Muy popular" basado en views, reservas y tiempo.

### 3.2 Sistema de Calendario y Disponibilidad
- **Calendario por producto**: Vista mensual con días disponibles/ocupados.
- **Bloqueo manual**: El arrendador puede bloquear fechas no disponibles.
- **Bloqueo por reservas**: Automático al confirmar una orden.
- **Mínimo de días**: Restricción configurable por listing.

### 3.3 Sistema de Precios
- **Pricing escalonado**: Configuración de precio por día para diferentes duraciones (ej. 1 día = 50€/día, 7 días = 30€/día).
- **Precio dinámico**: El sistema calcula el precio total en función de las fechas seleccionadas.
- **Comisión de plataforma**: Añadida en el checkout (visible para el usuario).

### 3.4 Sistema de Mensajería
- **Chat integrado**: Comunicación entre arrendador y arrendatario dentro de la plataforma.
- **Notificaciones**: Push, email y SMS para nuevos mensajes, solicitudes, recordatorios.
- **Plantillas**: Respuestas rápidas para arrendadores.

### 3.5 Sistema de Reviews y Reputación
- **Double-blind review**: Las reviews se publican mutuamente para evitar sesgos de retaliación.
- **Rating por categorías**: Comunicación, puntualidad, estado del producto.
- **Reviews de producto vs. reviews de usuario**: Diferenciación entre calidad del bien y calidad del trato.

### 3.6 Sistema de Seguros y Confianza
- **Seguro de daños**: Cubre daños accidentales durante el alquiler.
- **Franquicia variable**: Algunas categorías tienen franquicia (ej. vehículos, trailers).
- **Verificación de identidad escalonada**: KYC opcional con DNI/documento de identidad. El seguro de plataforma solo está disponible cuando ambas partes (arrendador y arrendatario) están verificadas. Los usuarios no verificados pueden publicar y alquilar sin límite, pero sin acceso al seguro ni a reservas instantáneas.
- **Depósito de garantía**: Opcional para productos de alto valor.

### 3.7 Sistema de Pagos
- **Hold de fondos**: El pago se retiene hasta la confirmación de devolución.
- **Split payments**: División entre arrendador (menos comisión) y plataforma.
- **Reembolsos**: Política de cancelación con reembolso parcial/total según antelación.
- **Wallet/Balance**: Opcionalmente, saldo acumulable para el arrendador.

---

## 4. Jerarquía de Categorías (Inspirada en Hygglo)

Hygglo maneja cientos de categorías muy específicas. A continuación, las familias principales adaptadas al mercado español:

### Familias de Categorías
1. **Herramientas y Bricolaje**
   - Taladros, amoladoras, lijadoras, sierras
   - Compresores, generadores
   - Andamios, escaleras
   - Limpiadoras de alta presión

2. **Jardín y Exterior**
   - Cortacésped, desbrozadoras
   - Barbacoas, fogones
   - Mobiliario de jardín, carpas

3. **Vehículos y Remolques**
   - Remolques (carga, caballos, motos)
   - Bicicletas de carga, triciclos
   - Patinetes eléctricos, e-bikes

4. **Electrónica y Multimedia**
   - Cámaras fotográficas, objetivos, drones
   - Proyectores, pantallas
   - Altavoces portátiles, equipos de sonido
   - Consolas y videojuegos

5. **Deportes y Ocio**
   - Tablas de paddle surf, kayaks, kitesurf
   - Bicicletas (carretera, montaña, ciudad)
   - Tiendas de campaña, sacos de dormir
   - Esquís, snowboards (temporada)

6. **Fiestas y Eventos**
   - Castillos hinchables
   - Máquinas de palomitas, algodón de azúcar, slush
   - Mesas, sillas, vajillas
   - Iluminación y efectos

7. **Hogar y Limpieza**
   - Aspiradoras industriales
   - Limpiadoras de tapicería y alfombras
   - Planchas, centros de planchado

8. **Bebés y Niños**
   - Cochecitos, sillas de coche
   - Cunas de viaje, tronas
   - Juguetes grandes (cocinitas, casitas)

---

## 5. Datos Clave para el Marketplace

### 5.1 Señales de Confianza en el Listing
- Número de órdenes completadas ("completedOrders").
- Rating promedio ("averageRating").
- Badge de "fastResponder".
- Badge de "Verificado" (KYC completado) — visible en perfil, tarjeta de listing y chat.
- Nivel de usuario (Registrado / Verificado / Superarrendador).
- Tiempo de respuesta promedio.
- Fotos de calidad y descripción detallada.
- Aviso contextual en listings de usuarios no verificados sobre ausencia de seguro de plataforma.

### 5.2 Señales de Popularidad
- Vistas del listing en los últimos 7 días.
- Ratio de conversión (solicitudes / vistas).
- Reservas recientes.
- Guardados en favoritos.

### 5.3 Segmentación Geográfica
- **Nivel 1**: País (España).
- **Nivel 2**: Comunidad Autónoma / Región.
- **Nivel 3**: Provincia.
- **Nivel 4**: Municipio / Ciudad.
- **Nivel 5**: Barrio / Zona (ej. "Gràcia, Barcelona").
- **Precisión**: Coordenadas GPS para cálculo de distancia.
