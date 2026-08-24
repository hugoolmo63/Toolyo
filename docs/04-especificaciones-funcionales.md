# Especificaciones Funcionales Detalladas

## 1. Módulo de Autenticación y Onboarding

### 1.1 Registro de Usuario
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| AUTH-001 | Registro con email + contraseña o SSO (Google, Apple, Facebook). | Alta |
| AUTH-002 | Verificación de email mediante código OTP. | Alta |
| AUTH-003 | Verificación de número de teléfono mediante SMS OTP. | Alta |
| AUTH-004 | Flujo de KYC para verificación de identidad (DNI/NIE + selfie en vivo) antes de publicar o alquilar bienes >200€. | Alta |
| AUTH-005 | Aceptación de Términos y Condiciones y Política de Privacidad en el registro. | Alta |

### 1.2 Perfil de Usuario
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| PROF-001 | Edición de foto de perfil, nombre, bio, ubicación preferida. | Media |
| PROF-002 | Visualización pública del perfil con rating, reviews recibidas, número de transacciones completadas, badges. | Alta |
| PROF-003 | Configuración de notificaciones (email, push, SMS) por tipo de evento. | Media |
| PROF-004 | Gestión de métodos de pago (tarjetas, Bizum, cuenta bancaria para payouts). | Alta |
| PROF-005 | Historial de transacciones: alquileres realizados, bienes alquilados, ingresos, estado de payouts. | Alta |

---

## 2. Módulo de Listings (Publicaciones)

### 2.1 Creación de Listing
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| LIST-001 | Wizard de creación en 4 pasos: (1) Categoría, (2) Fotos y descripción, (3) Precios y disponibilidad, (4) Ubicación. | Alta |
| LIST-002 | Selector de categoría con búsqueda y árbol jerárquico (2-3 niveles). | Alta |
| LIST-003 | Subida de hasta 10 fotos por producto, con ordenación por drag & drop. | Alta |
| LIST-004 | Campo de título (máx. 80 caracteres) y descripción enriquecida (markdown ligero). | Alta |
| LIST-005 | Configuración de precios escalonados: precio por día para 1 día, 3 días, 7 días, y tarifa personalizada para períodos mayores. | Alta |
| LIST-006 | Configuración de mínimo de días de alquiler (por defecto 1). | Media |
| LIST-007 | Selección de ubicación en mapa interactivo + dirección textual. | Alta |
| LIST-008 | Calendario de disponibilidad con posibilidad de bloquear fechas manualmente. | Alta |
| LIST-009 | Previsualización del listing antes de publicar. | Media |
| LIST-010 | Estados del listing: Borrador, En revisión, Publicado, Pausado, Rechazado. | Alta |

### 2.2 Gestión de Listings
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| LIST-011 | Dashboard del arrendador con listado de sus publicaciones. | Alta |
| LIST-012 | Edición de campos del listing post-publicación (con re-indexación inmediata). | Alta |
| LIST-013 | Pausar/reactivar listing sin perder datos ni reviews. | Media |
| LIST-014 | Duplicar listing como plantilla para crear variantes. | Baja |
| LIST-015 | Estadísticas de vistas, clics y conversiones por listing. | Media |

---

## 3. Módulo de Búsqueda y Descubrimiento

### 3.1 Búsqueda Principal
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| SEARCH-001 | Barra de búsqueda global con autocompletado de ubicaciones y categorías. | Alta |
| SEARCH-002 | Detección automática de ubicación del usuario (con permiso GPS) o selección manual. | Alta |
| SEARCH-003 | Filtros: categoría, rango de fechas, precio máximo por día, distancia máxima (km), rating mínimo. | Alta |
| SEARCH-004 | Ordenación: Relevancia, Más cercano, Precio (asc/desc), Mejor valorado, Más popular. | Alta |
| SEARCH-005 | Resultados en vista de grid (tarjetas) o lista. | Media |
| SEARCH-006 | Mapa interactivo con pins de productos, clic para ver preview. | Alta |
| SEARCH-007 | Paginación infinita (infinite scroll) en móvil, paginación numerada en desktop. | Media |

### 3.2 Tarjeta de Producto
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| CARD-001 | Imagen principal, nombre del producto, precio por día, badge de popularidad. | Alta |
| CARD-002 | Distancia al usuario (en km o "a X minutos"). | Alta |
| CARD-003 | Rating del producto y número de reviews. | Alta |
| CARD-004 | Nombre y avatar del arrendador, badge de fast responder. | Media |
| CARD-005 | Botón de favorito (corazón) con toggle. | Media |

### 3.3 Página de Detalle del Producto
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DET-001 | Galería de imágenes con carrusel, zoom, fullscreen. | Alta |
| DET-002 | Título, descripción completa, características. | Alta |
| DET-003 | Calendario de disponibilidad interactivo (selección de fechas de recogida y devolución). | Alta |
| DET-004 | Tabla de precios escalonados (días vs. precio/día vs. total). | Alta |
| DET-005 | Perfil del arrendador con foto, nombre, rating, tiempo de respuesta, número de transacciones. | Alta |
| DET-006 | Botón de "Contactar" que abre chat con el arrendador. | Alta |
| DET-007 | Botón de "Reservar" que inicia el flujo de checkout. | Alta |
| DET-008 | Sección de reviews con puntuación media, distribución de estrellas, y reviews individuales con fotos. | Alta |
| DET-009 | Productos similares en la misma zona/categoría. | Media |
| DET-010 | Información del seguro aplicable y franquicia (si aplica). | Alta |
| DET-011 | Reglas del arrendador (política de cancelación, horarios de recogida/devolución). | Media |

---

## 4. Módulo de Reservas y Pagos

### 4.1 Flujo de Reserva
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| BOOK-001 | Selección de fechas con validación de disponibilidad en tiempo real. | Alta |
| BOOK-002 | Cálculo automático del precio total en función de los días seleccionados y la tarifa escalonada. | Alta |
| BOOK-003 | Desglose de precios en checkout: subtotal (alquiler), comisión de plataforma, seguro (opcional), total. | Alta |
| BOOK-004 | Solicitud de reserva (el arrendador debe aprobar) o reserva instantánea (configurable por arrendador). | Alta |
| BOOK-005 | Temporizador de expiración para solicitudes pendientes (ej. 24h para aprobación del arrendador). | Alta |
| BOOK-006 | Notificaciones push/email/SMS al arrendador cuando recibe una solicitud. | Alta |
| BOOK-007 | Posibilidad de enviar mensaje junto con la solicitud de reserva. | Media |

### 4.2 Pagos
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| PAY-001 | Integración con pasarela de pago (Stripe) con soporte de 3D Secure / SCA (PSD2). | Alta |
| PAY-002 | Hold/preautorización del importe total en el momento de la reserva. | Alta |
| PAY-003 | Captura del pago al confirmar la aprobación del arrendador o al inicio del alquiler. | Alta |
| PAY-004 | Split payment: comisión retenida por plataforma, resto transferido al arrendador (Stripe Connect). | Alta |
| PAY-005 | Soporte de Bizum como método de pago alternativo para usuarios españoles. | Media |
| PAY-006 | Wallet interno: el arrendador puede acumular saldo o solicitar transferencia a cuenta bancaria. | Media |
| PAY-007 | Emisión automática de factura simplificada / recibo para ambas partes. | Media |

### 4.3 Cancelaciones y Reembolsos
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| CANC-001 | Política de cancelación configurable por arrendador: Flexible (reembolso 100% hasta 24h antes), Moderada (50% hasta 48h), Estricta (0% reembolso). | Alta |
| CANC-002 | Reembolso automático al método de pago original según la política aplicable. | Alta |
| CANC-003 | Penalización por no-show del arrendatario (pérdida del 100% del importe). | Media |

---

## 5. Módulo de Mensajería

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| CHAT-001 | Chat en tiempo real entre arrendador y arrendatario (WebSockets / Socket.io). | Alta |
| CHAT-002 | Historial de mensajes persistente asociado a cada reserva. | Alta |
| CHAT-003 | Notificaciones push/email para nuevos mensajes. | Alta |
| CHAT-004 | Compartir imágenes en el chat (para dudas sobre el producto). | Media |
| CHAT-005 | Plantillas de respuesta rápida para arrendadores. | Baja |
| CHAT-006 | Moderación automática de contenido inapropiado (filtrado de palabras, reporte de usuarios). | Media |

---

## 6. Módulo de Reviews y Reputación

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| REV-001 | Review mutua post-alquiler: ambas partes tienen 14 días para dejar review. | Alta |
| REV-002 | Sistema de doble ciego: las reviews se publican simultáneamente tras el período o cuando ambas han sido enviadas. | Alta |
| REV-003 | Puntuación en escala 1-5 estrellas con opción de comentario textual y fotos. | Alta |
| REV-004 | Categorías de rating: Comunicación, Puntualidad, Estado del producto (para arrendador); Cuidado del producto, Puntualidad (para arrendatario). | Media |
| REV-005 | Reviews visibles públicamente en el perfil del usuario y en el listing del producto. | Alta |
| REV-006 | Reporte de reviews inapropiadas con revisión manual por moderador. | Media |
| REV-007 | Cálculo de rating promedio ponderado por recencia (reviews más recientes tienen más peso). | Baja |

---

## 7. Módulo de Seguros y Confianza

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| INS-001 | Contratación automática de seguro de daños para cada alquiler (on-demand). | Alta |
| INS-002 | Cobertura estándar sin franquicia para la mayoría de categorías. | Alta |
| INS-003 | Franquicia configurable por categoría (ej. 100€ para vehículos y remolques). | Media |
| INS-004 | Proceso de reclamación de daños desde la plataforma: formulario con fotos, descripción, valoración. | Alta |
| INS-005 | Gestión de disputas: mediación de la plataforma, resolución con evidencia fotográfica. | Alta |
| INS-006 | Checklist de estado del producto en recogida y devolución (fotos obligatorias para productos >500€). | Media |

---

## 8. Módulo de Notificaciones

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| NOT-001 | Notificaciones push en móvil para eventos clave (nueva reserva, mensaje, recordatorio de devolución). | Alta |
| NOT-002 | Emails transaccionales: confirmación de reserva, recordatorio de recogida, recordatorio de devolución, receipt de pago. | Alta |
| NOT-003 | SMS para eventos críticos (código OTP, recordatorio de devolución en 1h). | Media |
| NOT-004 | Centro de notificaciones in-app con historial y marcar como leído. | Media |
| NOT-005 | Preferencias de notificación configurables por el usuario. | Media |

---

## 9. Módulo Administrativo (Backoffice)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| ADMIN-001 | Panel de administración con autenticación de doble factor. | Alta |
| ADMIN-002 | Gestión de usuarios: listado, búsqueda, verificación manual de KYC, suspensión de cuentas. | Alta |
| ADMIN-003 | Gestión de listings: aprobación, edición, suspensión, eliminación. | Alta |
| ADMIN-004 | Gestión de reservas: visibilidad de todas las transacciones, mediación de disputas, cancelaciones forzadas. | Alta |
| ADMIN-005 | Gestión de reviews: moderación, eliminación de reviews que incumplan normas. | Media |
| ADMIN-006 | Reportes y analytics: transacciones por período, ingresos de comisiones, usuarios activos, conversiones. | Alta |
| ADMIN-007 | Gestión de categorías: crear, editar, asignar reglas de seguro. | Media |
| ADMIN-008 | Gestión de contenido: FAQ, términos y condiciones, páginas informativas. | Media |

---

## 10. MVP — Scope Reducido para Lanzamiento

Para el lanzamiento inicial (Fase 1), se recomienda implementar únicamente:

1. **Auth**: Registro/login básico + verificación email/teléfono. KYC manual en backend.
2. **Listings**: Creación básica con hasta 5 fotos, precio fijo por día (sin escalonado en MVP), ubicación por texto.
3. **Búsqueda**: Por ubicación (texto) + categoría, sin filtros avanzados en MVP.
4. **Reservas**: Solicitud de reserva con aprobación manual, sin pagos automatizados en MVP (pago en mano gestionado por usuarios, con seguimiento de estado).
5. **Chat**: Mensajería básica (no necesariamente en tiempo real; polling cada 30s es aceptable en MVP).
6. **Reviews**: Post-alquiler, publicación inmediata (sin doble ciego en MVP).
7. **Admin**: Panel básico para ver usuarios, listings y marcar reservas como completadas.

**Pagos automatizados, seguros integrados, calendario complejo y app nativa se dejan para la Fase 2.**
