# Documentación del Proyecto: Plataforma de Alquiler P2P
## Adaptación de Hygglo para el Mercado Español

---

## Índice de Documentos

Este repositorio contiene la documentación completa para el desarrollo de una plataforma de alquiler de bienes entre particulares, inspirada en Hygglo (líder en los países nórdicos) y adaptada al mercado español.

### 📄 Documentos Disponibles

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [`01-vision-y-modelo-de-negocio.md`](./01-vision-y-modelo-de-negocio.md) | Propuesta de valor, modelo de negocio (Business Model Canvas), diferenciación para España y roadmap de fases. |
| 2 | [`02-analisis-funcional.md`](./02-analisis-funcional.md) | Análisis profundo de entidades, flujos de usuario y funcionalidades extraídas del estudio de Hygglo.dk. |
| 3 | [`03-arquitectura-y-tech-stack.md`](./03-arquitectura-y-tech-stack.md) | Arquitectura del sistema, stack tecnológico recomendado, modelo de datos y consideraciones de escalabilidad. |
| 4 | [`04-especificaciones-funcionales.md`](./04-especificaciones-funcionales.md) | Especificaciones funcionales detalladas por módulo (auth, listings, búsqueda, reservas, pagos, chat, reviews, seguros, admin). Incluye scope del MVP. |
| 5 | [`05-diagramas-navegacion.md`](./05-diagramas-navegacion.md) | Mapa del sitio, flujos de usuario, diagramas de secuencia, diagramas de estado y wireframes de pantallas principales. |
| 6 | [`06-adaptacion-mercado-espanol.md`](./06-adaptacion-mercado-espanol.md) | Análisis del mercado español, adaptaciones legales (RGPD, AML), localización, pagos (Bizum), seguros, estrategia de lanzamiento por ciudades y métricas. |
| 7 | [`07-analisis-de-competencia.md`](./07-analisis-de-competencia.md) | Análisis detallado de competidores: Wallapop (ES), Hygglo (Nórdico), Share y Flecto (PT), AlloVoisins y Bricolib (FR). Matriz comparativa, FODA y oportunidades de diferenciación. |

---

## Resumen Ejecutivo

### ¿Qué es Hygglo?
**Hygglo** es la plataforma líder de alquiler P2P (peer-to-peer) en Dinamarca, Suecia, Noruega y Finlandia. Su modelo permite a particulares:
- **Monetizar bienes ociosos**: Herramientas, remolques, bicicletas, equipos de camping, artículos de fiesta, cámaras, etc.
- **Acceder a bienes sin comprarlos**: Alquiler por horas o días con precios decrecientes por volumen.
- **Operar con confianza**: Seguro integrado, sistema de reviews, verificación de identidad y geolocalización.

### Objetivo de este Proyecto
Construir una plataforma equivalente, **adaptada cultural y legalmente al mercado español**, con lanzamiento progresivo por ciudades y foco en las categorías de mayor demanda en España (herramientas, remolques, bicicletas de carga, equipos de playa y artículos de fiesta).

---

## Estructura del Sistema (Vista de Alto Nivel)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │     │  iOS App    │     │ Android App │
│  (Next.js)  │     │(React Native)│    │(React Native)│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │  API / CDN  │
                    │   (Vercel)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
    │PostgreSQL│      │  Redis  │      │Elastic  │
    │(Prisma) │      │ (Cache) │      │Search   │
    └─────────┘      └─────────┘      └─────────┘
```

---

## Roadmap de Lanzamiento

| Fase | Duración | Alcance | Ciudades |
|------|----------|---------|----------|
| **MVP** | 0-6 meses | Web responsive, auth básico, listings, búsqueda por texto, reservas manuales, chat básico, reviews. | Madrid, Barcelona |
| **Crecimiento** | 6-18 meses | App nativa, pagos automatizados (Stripe + Bizum), seguros integrados, calendario avanzado, programa de referidos. | Valencia, Sevilla, Málaga, Bilbao |
| **Consolidación** | 18-36 meses | B2B, logística opcional, cobertura nacional, expansión a Portugal. | Nacional |

---

## Contacto y Contribuciones

Este documento es un punto de partida vivo. A medida que avance el desarrollo, se actualizarán las especificaciones, se añadirán mockups de diseño y se documentarán las APIs.
