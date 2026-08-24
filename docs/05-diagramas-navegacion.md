# Diagramas de Navegación y Flujos de Usuario

## 1. Arquitectura de Información (Site Map)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HYGGLO ESPAÑA                                  │
│                         Mapa de Navegación                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   LANDING    │
│   (Página    │
│   Principal) │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┬───────────────┐
       │                 │                 │                 │               │
       ▼                 ▼                 ▼                 ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   EXPLORAR   │ │   CÓMO       │ │   PUBLICAR   │ │    AYUDA     │ │   MI CUENTA  │
│  (Búsqueda)  │ │  FUNCIONA    │ │   (Arrendar) │ │   (FAQ/      │ │   (Auth)     │
│              │ │              │ │              │ │   Contacto)  │ │              │
└──────┬───────┘ └──────────────┘ └──────┬───────┘ └──────────────┘ └──────┬───────┘
       │                                 │                                 │
       │         ┌───────────────────────┘                                 │
       │         │                                                         │
       ▼         ▼                                                         ▼
┌──────────────┐ ┌────────────────────────────────────────────┐  ┌──────────────────┐
│  RESULTADOS  │ │          DASHBOARD ARRENDADOR              │  │   PERFIL USER    │
│   (Grid +    │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │  ┌────────────┐  │
│    Mapa)     │ │  │ Mis      │ │ Calen-   │ │ Mensajes │  │  │  │ Mis datos  │  │
│              │ │  │ Listings │ │ dario    │ │          │  │  │  │ Preferencias│  │
└──────┬───────┘ │  └──────────┘ └──────────┘ └──────────┘  │  │  │ Pagos      │  │
       │         │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │  │ Notificac. │  │
       │         │  │ Ingresos │ │ Reservas │ │ Ajustes  │  │  │  └────────────┘  │
       │         │  └──────────┘ └──────────┘ └──────────┘  │  └──────────────────┘
       │         └────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   DETALLE    │
│   PRODUCTO   │
│  (Galería,   │
│   Precios,   │
│   Reviews)   │
└──────┬───────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    CHAT      │ │   CHECKOUT   │ │  PERFIL      │
│  (Con owner) │ │  (Reserva +  │ │  ARRENDADOR  │
│              │ │   Pago)      │ │              │
└──────────────┘ └──────┬───────┘ └──────────────┘
                        │
                        ▼
               ┌────────────────┐
               │  CONFIRMACIÓN  │
               │   DE RESERVA   │
               └────────────────┘
```

---

## 2. Flujo de Navegación del Arrendatario (Quien Alquila)

```mermaid
flowchart TD
    A[Landing Page] --> B{¿Usuario registrado?}
    B -->|No| C[Registro / Login]
    B -->|Sí| D[Home / Explorar]
    C --> D

    D --> E[Buscar por ubicación]
    D --> F[Buscar por categoría]
    D --> G[Ver populares cerca]

    E --> H[Resultados de búsqueda]
    F --> H
    G --> H

    H --> I[Filtrar por precio, distancia, rating]
    H --> J[Ver en mapa]
    H --> K[Ordenar resultados]

    I --> L[Seleccionar producto]
    J --> L
    K --> L

    L --> M[Página de Detalle]
    M --> N[Ver galería de fotos]
    M --> O[Leer reviews]
    M --> P[Contactar arrendador]
    M --> Q[Seleccionar fechas]

    Q --> R{¿Fechas disponibles?}
    R -->|No| Q
    R -->|Sí| S[Ver precio calculado]

    S --> T[Checkout / Reservar]
    T --> U{¿Reserva instantánea?}
    U -->|Sí| V[Pago con tarjeta]
    U -->|No| W[Solicitud enviada]

    W --> X{¿Arrendador aprueba?}
    X -->|Sí| V
    X -->|No| Y[Notificación de rechazo]
    Y --> D

    V --> Z[Confirmación de reserva]
    Z --> AA[Chat con arrendador]
    Z --> AB[Recordatorio de recogida]
    AB --> AC[Recogida del producto]
    AC --> AD[Período de alquiler]
    AD --> AE[Recordatorio de devolución]
    AE --> AF[Devolución del producto]
    AF --> AG[Dejar review]
```

---

## 3. Flujo de Navegación del Arrendador (Quien Publica)

```mermaid
flowchart TD
    A[Registro / Login] --> B[Onboarding]
    B --> C[Verificación KYC]
    C --> D{¿Verificado?}
    D -->|No| E[Esperando aprobación]
    D -->|Sí| F[Dashboard Arrendador]

    F --> G[Crear nuevo listing]
    F --> H[Gestionar listings existentes]
    F --> I[Ver calendario de reservas]
    F --> J[Ver mensajes]
    F --> K[Ver ingresos]

    G --> L[Paso 1: Seleccionar categoría]
    L --> M[Paso 2: Subir fotos + descripción]
    M --> N[Paso 3: Configurar precios]
    N --> O[Paso 4: Ubicación y disponibilidad]
    O --> P[Previsualizar listing]
    P --> Q[Publicar]
    Q --> R{¿Requiere revisión?}
    R -->|Sí| S[En revisión por admin]
    R -->|No| T[Publicado y visible]

    H --> U[Editar listing]
    H --> V[Pausar / Reactivar]
    H --> W[Ver estadísticas]

    I --> X[Aprobar/rechazar solicitudes]
    I --> Y[Bloquear fechas manualmente]

    X --> Z{¿Aprueba?}
    Z -->|Sí| AA[Notificar arrendatario]
    Z -->|No| AB[Notificar rechazo]

    AA --> AC[Esperar recogida]
    AC --> AD[Check de devolución]
    AD --> AE[Liberar pago]
    AE --> AF[Dejar review]
```

---

## 4. Flujo de Transacción y Pagos

```mermaid
sequenceDiagram
    participant A as Arrendatario
    participant P as Plataforma
    participant O as Arrendador
    participant PG as Pasarela de Pago
    participant INS as Aseguradora

    A->>P: Selecciona fechas y solicita reserva
    P->>P: Valida disponibilidad
    alt Reserva instantánea
        P->>PG: Preautoriza pago (hold)
        PG-->>P: Hold confirmado
    else Solicitud de reserva
        P->>O: Notificación de solicitud
        O->>P: Aprueba solicitud
        P->>PG: Preautoriza pago (hold)
        PG-->>P: Hold confirmado
    end
    P->>A: Confirmación de reserva
    P->>INS: Activa seguro (on-demand)
    INS-->>P: Póliza generada

    Note over A,O: Período de alquiler

    A->>O: Recoge el producto
    O->>P: Confirma entrega (check-in)
    P->>PG: Captura el pago
    PG-->>P: Pago capturado

    A->>O: Devuelve el producto
    O->>P: Confirma devolución (check-out)
    P->>PG: Split payment
    PG->>O: Transfiere payout (menos comisión)
    PG->>P: Retiene comisión

    P->>A: Solicita review
    P->>O: Solicita review
    A->>P: Envía review
    O->>P: Envía review
    P->>P: Publica reviews simultáneamente
```

---

## 5. Diagrama de Estados de una Reserva

```mermaid
stateDiagram-v2
    [*] --> Solicitada: El usuario solicita reserva
    Solicitada --> CanceladaPorUsuario: El usuario cancela
    Solicitada --> Rechazada: El arrendador rechaza
    Solicitada --> Aprobada: El arrendador aprueba
    Solicitada --> Expirada: Pasan 24h sin respuesta

    Aprobada --> CanceladaPorUsuario: Cancelación temprana
    Aprobada --> CanceladaPorOwner: El arrendador cancela
    Aprobada --> Pagada: El usuario paga

    Pagada --> EnCurso: Inicia período de alquiler
    Pagada --> CanceladaConReembolso: Cancelación con política aplicable

    EnCurso --> Completada: Finaliza período + check-out
    EnCurso --> Disputa: Reclamación de daños/incidencia

    Disputa --> ResueltaA favorDelUsuario: Mediación
    Disputa --> ResueltaA favorDelOwner: Mediación
    Disputa --> Completada: Acuerdo mutuo

    Completada --> [*]
    CanceladaPorUsuario --> [*]
    CanceladaPorOwner --> [*]
    Rechazada --> [*]
    Expirada --> [*]
    CanceladaConReembolso --> [*]
    ResueltaA favorDelUsuario --> [*]
    ResueltaA favorDelOwner --> [*]
```

---

## 6. Diagrama de Estados de un Listing

```mermaid
stateDiagram-v2
    [*] --> Borrador: Creación iniciada
    Borrador --> EnRevision: Usuario envía a revisión
    Borrador --> Borrador: Guarda cambios

    EnRevision --> Publicado: Admin aprueba
    EnRevision --> Rechazado: Admin rechaza
    Rechazado --> Borrador: Usuario corrige

    Publicado --> Pausado: Usuario pausa
    Publicado --> EnRevision: Edición requiere revisión
    Publicado --> Eliminado: Usuario elimina

    Pausado --> Publicado: Usuario reactiva
    Pausado --> Eliminado: Usuario elimina
    Pausado --> Borrador: Usuario edita

    Eliminado --> [*]
```

---

## 7. Flujo de Onboarding y KYC

```mermaid
flowchart LR
    A[Registro básico] --> B[Verificar email]
    B --> C[Verificar teléfono]
    C --> D[Completar perfil]

    D --> E{¿Quiere publicar o alquilar >200€?}
    E -->|No| F[Usuario verificado básico]
    E -->|Sí| G[KYC:
    DNI/NIE +
    Selfie en vivo]

    G --> H{¿Validación automática?}
    H -->|Sí| I[Usuario verificado completo]
    H -->|No| J[Revisión manual por admin]
    J -->|Aprobado| I
    J -->|Rechazado| K[Solicitar documentación adicional]
    K --> G

    F --> L[Explorar / Alquilar <200€]
    I --> M[Publicar listings]
    I --> N[Alquilar sin límite]
```

---

## 8. Wireframes de Navegación por Pantalla

### 8.1 Estructura de la Landing Page
```
┌────────────────────────────────────────────┐
│  [Logo]    [Buscar]    [Publicar] [Login]  │  ← Header fijo
├────────────────────────────────────────────┤
│                                            │
│         HERO: "Alquila en lugar de         │
│              comprar"                      │
│                                            │
│   [¿Qué necesitas?] [¿Dónde?] [Buscar]   │
│                                            │
├────────────────────────────────────────────┤
│  CATEGORÍAS POPULARES:                     │
│  [🔧] [🚲] [⛺] [🎉] [📷] [🚗]           │
│  Herramientas Bicis Camping Fiesta Fotos   │
├────────────────────────────────────────────┤
│  POPULARES CERCA DE TI:                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  │IMG  │ │IMG  │ │IMG  │ │IMG  │         │
│  │Talad│ │Remol│ │Tiend│ │Sonid│         │
│  │50€/d│ │30€/d│ │25€/d│ │40€/d│         │
│  └─────┘ └─────┘ └─────┘ └─────┘         │
├────────────────────────────────────────────┤
│  CÓMO FUNCIONA:                            │
│  1. Busca → 2. Reserva → 3. Recoge →      │
│     4. Devuelve                            │
├────────────────────────────────────────────┤
│  [Footer: Sobre nosotros, Ayuda, Legal]    │
└────────────────────────────────────────────┘
```

### 8.2 Estructura de Página de Detalle
```
┌────────────────────────────────────────────┐
│  [Logo]    [Buscar]    [Publicar] [Login]  │
├────────────────────────────────────────────┤
│  [IMG Principal] [Thumb] [Thumb] [Thumb]   │
├────────────────────────────────────────────┤
│  Nombre del producto              [♥]      │
│  ⭐ 4.8 (23 reviews)    📍 A 2.3 km        │
│                                            │
│  Descripción del producto...               │
│  Ver más                                   │
├────────────────────────────────────────────┤
│  📅 CALENDARIO DE DISPONIBILIDAD           │
│  [Jun] [Jul] [Ago] ...                   │
│  [1][2][3][4]... seleccionar fechas      │
├────────────────────────────────────────────┤
│  💰 PRECIOS:                               │
│  1 día: 50€/día  |  3 días: 40€/día      │
│  7 días: 30€/día  |  +7 días: a consultar │
├────────────────────────────────────────────┤
│  👤 ARRENDADOR:                            │
│  [Foto] María · ⭐ 5.0 · Respuesta <1h    │
│  [Ver perfil] [Contactar]                  │
├────────────────────────────────────────────┤
│  🛡️ SEGURO: Cubierto sin franquicia        │
├────────────────────────────────────────────┤
│  💬 REVIEWS (23):                          │
│  ⭐⭐⭐⭐⭐ "Todo perfecto, muy amable"      │
│  ⭐⭐⭐⭐⭐ "El producto estaba impecable"    │
├────────────────────────────────────────────┤
│  [        RESERVAR AHORA — 120€           ]│
│         (2 días × 50€ + comisión)          │
└────────────────────────────────────────────┘
```

### 8.3 Estructura del Dashboard Arrendador
```
┌────────────────────────────────────────────┐
│  [Logo]    [Buscar]    [Publicar] [Avatar▼]│
├────────────────┬───────────────────────────┤
│  MENÚ          │  CONTENIDO PRINCIPAL      │
│  ───────────── │                           │
│  📋 Mis anuncios                           │
│  📅 Calendario                             │
│  💬 Mensajes (3)                           │
│  📦 Reservas    →  [Tabla de reservas]     │
│  💶 Ingresos    →  [Gráfico + historial]   │
│  ⚙️ Ajustes                                │
│  🆘 Ayuda                                  │
├────────────────┴───────────────────────────┤
│  [Footer]                                  │
└────────────────────────────────────────────┘
```

---

## 9. Flujo de Notificaciones Push/Email

```mermaid
flowchart TD
    subgraph Eventos del Sistema
        E1[Nueva reserva solicitada]
        E2[Reserva aprobada]
        E3[Nuevo mensaje en chat]
        E4[Recordatorio recogida -24h]
        E5[Recordatorio devolución -2h]
        E6[Review pendiente]
        E7[Pago recibido]
        E8[Disputa abierta]
    end

    E1 --> N1[Push + Email + SMS al Arrendador]
    E2 --> N2[Push + Email al Arrendatario]
    E3 --> N3[Push + Email al receptor]
    E4 --> N4[Push + Email al Arrendatario]
    E5 --> N5[Push + Email a ambas partes]
    E6 --> N6[Email + Push diario hasta completar]
    E7 --> N7[Email al Arrendador]
    E8 --> N8[Push + Email + SMS a ambas partes + Admin]
```
