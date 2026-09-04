# Entornos y Despliegue — Estrategia de Versionado y Ciclos de Vida

> Documento de trabajo. Define la estrategia de entornos (`LOCAL`, `PRU`, `PRO`),
> el modelo de versionado de artefactos y la separación entre **construcción** y
> **despliegue** usando exclusivamente GitHub + GitHub Actions (sin piezas nuevas).
>
> Estado: borrador para revisión. Pendiente de concretar la infraestructura de
> `PRO` (cloud, proveedor por determinar).

---

## 1. Contexto del proyecto

Toolyo es una plataforma de alquiler P2P (adaptación de Hygglo para España). El
código vive en `development/` y el stack relevante para despliegue es:

- **Next.js 14+ (App Router)** sobre Node.js 20+ LTS — aplicación monolítica
  full-stack (UI + API tRPC en el mismo proceso).
- **PostgreSQL 15 + PostGIS** (vía Prisma) como base de datos transaccional.
- **Adaptadores externos** (email, SMS, KYC, geocoding) configurables por
  variables de entorno — ver `development/.env.example`.
- **Tests**: Vitest (unit + integración con Testcontainers).
- **Docker**: existe `development/docker-compose.yml` solo para levantar la BD
  local. **No existe `Dockerfile`** todavía (pendiente de crear).
- **CI/CD**: hoy **no hay workflows de GitHub Actions**. Solo skills de
  speckit bajo `.github/skills/`.
- **Repo actual**: `github.com/hugoolmo63/Toolyo`, rama por defecto `main`.

Implicaciones para la estrategia:

1. Al ser Next.js full-stack, **un único artefacto** (imagen Docker) contiene
   UI + API. No hay frontend/backend separados que versionar de forma
   independiente.
2. La BD es parte del ciclo de vida: las migraciones Prisma viajan con el
   código y deben aplicarse como paso del despliegue, versionadas con el
   artefacto.
3. El proyecto sigue una **constitución** (`constitution/`) con política
 SemVer para sus documentos; conviene alinear el versionado de artefactos
   con esa misma política.

---

## 2. Entornos

### 2.1 LOCAL — desarrollo diario

| Atributo | Valor |
|----------|-------|
| Propósito | Desarrollo diario del equipo, inestable, "usar y tirar". |
| Estabilidad | Ninguna. Cambiante. |
| Aislamiento | Cada desarrollador tiene el suyo en su máquina. **No debe interferir con ningún otro miembro ni con PRU/PRO.** |
| Dónde corre | Máquina del desarrollador. |
| BD | PostgreSQL local vía `development/docker-compose.yml` (contenedor efímero). |
| Arranque | `npm run dev` (Next.js en modo desarrollo, hot reload). |
| Datos | Seed local (`npm run db:seed`), desechables. |
| Acceso | Solo el desarrollador, `localhost:3000`. |
| Versionado | No aplica. Se trabaja contra la rama/commit que se quiera. |
| Red | Localhost. Sin exposición externa. |

**Reglas operativas:**

- LOCAL **no consume artefactos versionados**. Es el único entorno que corre
  desde el árbol de fuentes con `npm run dev`.
- Cada desarrollador gestiona su propio `.env` (copia de `.env.example`).
- La BD local se puede destruir y recrear libremente (`docker compose down -v`
  + `db:migrate` + `db:seed`).
- **Prohibido** apuntar LOCAL a bases de datos de PRU o PRO.

### 2.2 PRU — pruebas serias

| Atributo | Valor |
|----------|-------|
| Propósito | Ciclos de pruebas largos y serios. Estable durante la ventana de pruebas. |
| Estabilidad | Alta dentro de cada ciclo. Solo cambia cuando se promueve una versión nueva y explícita. |
| Dónde corre | **Intranet**. VM/servidor on-prem con Docker. |
| Acceso | Equipo de pruebas, de forma **independiente** dentro de la intranet. No expuesto a Internet. |
| Despliegue | `docker compose pull && up -d` vía SSH desde GitHub Actions ejecutándose en un **self-hosted runner** dentro de la intranet (ver §5.6). |
| BD | PostgreSQL persistente en la VM (volumen Docker o servicio dedicado). Datos de prueba, no desechables entre deploys (salvo reset explícito). |
| Migraciones | Aplicadas automáticamente como paso previo al arranque del contenedor de la app (`prisma migrate deploy`). |
| Versionado | Cada despliegue corresponde a **una versión SemVer identificable**. |

**Reglas operativas:**

- PRU **solo acepta artefactos publicados** (imágenes Docker de GHCR con tag
  SemVer). Nunca se despliega desde código sin versionar.
- El equipo de pruebas valida contra una versión concreta y registrada.
- El paso de versión en PRU es **un acto explícito y auditable** (workflow
  dispatch con input de versión), no un evento automático.
- PRU tiene su propio `.env` gestionado como secretos del entorno de deploy
  (ver §5.3).

### 2.3 PRO — producción (cloud, por determinar)

| Atributo | Valor |
|----------|-------|
| Propósito | Entorno vivo, accesible a usuarios reales. |
| Estabilidad | Máxima. Cambios solo tras paso por PRU y liberación explícita. |
| Dónde corre | **Cloud** (proveedor por determinar: candidatos Vercel, AWS, GCP, Azure, Fly.io). |
| Acceso | Internet público, tras CDN/WAF. |
| Despliegue | Por determinar según proveedor cloud. El pipeline de despliegue debe ser **agnóstico del proveedor** en la capa de artefactos y **específico** solo en el job final de deploy. |
| BD | Gestionada (RDS/Cloud SQL/Supabase) o self-hosted según proveedor. |
| Versionado | Igual que PRU: solo versiones SemVer liberadas. |

**Pendiente de definir (TODO):**

- Proveedor cloud concreto.
- Mecanismo de despliegue (Vercel CLI / ECS / Cloud Run / k8s gestionado /
  Fly.io).
- Estrategia de BD gestionada vs self-hosted.
- CDN, WAF, dominios, certificados TLS.
- Observabilidad (Sentry, logs, métricas) — `docs/03` ya menciona Vercel
  Analytics + Sentry + Logtail como candidatos.

**Principio rector mientras se decide:** el diseño del pipeline de
**construcción de artefactos** (repo app) es independiente del proveedor cloud
y quedará congelado. Solo el **job de despliegue a PRO** (repo deploy) será
específico del proveedor cuando se elija.

---

## 3. Modelo de dos repos (construcción vs despliegue)

Para garantizar **ciclos de vida independientes** entre "generar un artefacto
versionado" y "desplegarlo en un entorno", se separan responsabilidades en dos
repos:

### 3.1 Repo APP — `Toolyo` (este repo)

**Responsabilidad:** contener el código fuente y **construir artefactos
versionados identificables**. No despliega nada a ningún entorno.

- Contiene: código Next.js, Prisma, tests, constitution, docs.
- Workflow CI: en cada push/PR → lint, typecheck, tests unit + integración.
- Workflow **Release**: disparado por **git tag SemVer anotado** → build de
  imagen Docker → publish a GHCR → creación de GitHub Release.
- **No conoce** PRU ni PRO. No tiene credenciales de despliegue.

Ciclo de vida del repo APP: ligado al desarrollo. Tags cuando se decide
congelar una versión candidata.

### 3.2 Repo DEPLOY — `Toolyo-deploy` (nuevo, a crear)

**Responsabilidad:** desplegar **una versión ya construida** en el entorno
configurado. No contiene código de aplicación.

- Contiene:
  - Manifiestos de despliegue por entorno (`pru/docker-compose.yml`,
    `pro/...`).
  - Configuración no sensible por entorno (variables públicas, nombres de
    servicio, puertos).
  - Workflows de GitHub Actions de despliegue (dispatch manual con input de
    versión).
  - Documentación operativa (runbooks, procedimientos de rollback).
- **Referencia versiones** por tag SemVer de la imagen en GHCR
  (`ghcr.io/<owner>/toolyo:<version>`).
- Almacena **secretos** de cada entorno como GitHub Actions secrets
  (repo-level o environment-level).

Ciclo de vida del repo DEPLOY: independiente del repo APP. Se puede promover
una versión a PRU sin tocar el repo APP, y re-desplegar una versión anterior
(rollback) sin reconstruir nada.

### 3.3 Por qué dos repos y no uno

- **Aislamiento de credenciales:** el repo APP nunca tiene secretos de
  infraestructura. Si se compromete el repo APP, no se expone el acceso a
  PRU/PRO.
- **Ciclos de vida desacoplados:** se puede re-desplegar la versión `1.2.0`
  en PRU tres veces sin reconstruir la imagen.
- **Auditoría separada:** el historial de deploys (quén, cuándo, qué versión,
  qué entorno) vive en el repo DEPLOY, limpio del ruido del desarrollo.
- **Cumple la restricción "no meter piezas nuevas":** solo se añade un repo
  Git y se usan GitHub Actions + GHCR, que son capacidades nativas de GitHub.

### 3.4 Versionado de la imagen

- Esquema: **SemVer** (`MAJOR.MINOR.PATCH`) alineado con la política de la
  constitution.
- Disparador: **git tag anotado** en el repo APP con formato `v1.2.0`.
- Tags generados en GHCR:
  - `ghcr.io/<owner>/toolyo:1.2.0` — tag inmutable de la versión.
  - `ghcr.io/<owner>/toolyo:1.2` — rolling minor (opcional, útil para
    `latest` dentro de una minor).
  - `ghcr.io/<owner>/toolyo:latest` — **no se usa** para despliegues
    reproducibles (riesgo de deriva). Solo como comodidad de descubrimiento.
- Cada GitHub Release incluye:
  - Referencia a la imagen y su digest SHA256 (identificador criptográfico
    inmutable).
  - Changelog autogenerado o manual.
  - Hash de las migraciones Prisma incluidas (para trazabilidad de esquema).

---

## 4. Artefacto: imagen Docker

### 4.1 Dockerfile (pendiente de crear en `development/`)

Requisitos del Dockerfile a crear:

- **Multi-stage** para imagen final pequeña.
- Build con `output: "standalone"` de Next.js (configurar en
  `next.config.mjs`) → imagen final basada en `node:20-alpine` o
  `gcr.io/distroless/nodejs20`.
- **No incluir** `.env` ni secretos. La configuración se inyecta en runtime
  vía variables de entorno.
- **Incluir** los ficheros de migración Prisma (`prisma/migrations/`) y el
  cliente generado, para que el contenedor pueda ejecutar
  `prisma migrate deploy` al arrancar (o como paso previo en el workflow de
  deploy).
- Usuario no-root en la imagen final (cumple `constitution/SECURITY.md`).
- `HEALTHCHECK` apuntando a un endpoint ligero (p. ej. `/api/health` —
  pendiente de implementar).

### 4.2 Composición del contenedor en runtime

El contenedor de la app necesita estos servicios acompañantes (definidos en
el `docker-compose.yml` del repo DEPLOY por entorno):

- **PostgreSQL 15 + PostGIS** (persistente).
- **Redis** (cuando `RATE_LIMIT_STORE=redis` o sesiones distribuidas — hoy
  `memory` es válido para monoinstancia, ver `.env.example`).
- Adaptadores externos (email/SMS/KYC) son APIs remotas, no contenedores
  locales.

### 4.3 Migraciones como parte del artefacto

Las migraciones Prisma se empaquetan dentro de la imagen. El workflow de
despliegue ejecuta `prisma migrate deploy` **antes** de levantar la nueva
versión de la app, contra la BD del entorno destino. Esto garantiza que una
versión `1.2.0` siempre lleva el esquema que le corresponde.

> **Principio:** la imagen `1.2.0` es autocontenida respecto a su esquema de
> BD. No hay migraciones "sueltas" fuera del artefacto.

---

## 5. Pipelines con GitHub Actions

### 5.1 Repo APP — workflow `ci.yml` (continuo)

Triggers: `push` a cualquier rama, `pull_request` a `main`.

Jobs:

1. **lint-typecheck** — `npm run lint` + `tsc --noEmit`.
2. **test-unit** — `npm test` (Vitest unit).
3. **test-integration** — `npm run test:integration` con Testcontainers
   (PostgreSQL efímero).

No publica artefactos. Solo valida.

### 5.2 Repo APP — workflow `release.yml` (por tag)

Trigger: `push` de tag `v*.*.*` anotado.

Jobs:

1. **build-image** —
   - `docker/build-push-action` contra GHCR.
   - Tags: `<version>`, `<version major.minor>` (opcional).
   - Metadatos OCI (source, revision, creado con
     `docker/metadata-action`).
2. **github-release** —
   - Crea Release asociado al tag.
   - Adjunta digest SHA256 de la imagen y listado de migraciones incluidas.
3. **(opcional) sign** — firma de la imagen con cosign si más adelante se
   quiere verificar integridad en deploy. **No se incluye ahora** (evita
   meter piezas).

Secretos necesarios en repo APP: ninguno sensible de infraestructura. Solo
`GITHUB_TOKEN` (automático) para GHCR y Releases.

### 5.3 Repo DEPLOY — workflow `deploy-pru.yml`

Trigger: `workflow_dispatch` con input `version` (SemVer, p. ej. `1.2.0`).

**Ejecución**: `runs-on: [self-hosted, pru]` — el workflow se ejecuta en el
self-hosted runner instalado en la intranet (ver §5.6). Esto elimina la
necesidad de SSH desde fuera: el runner ya está dentro de la red y puede
invocar `docker compose` directamente en la VM de PRU (o ser la propia VM).

Jobs (environment `pru`):

1. **resolve-image** — valida que `ghcr.io/<owner>/toolyo:<version>` existe
   y obtiene su digest (consulta a la API de GHCR con `GITHUB_TOKEN`).
2. **deploy** —
   - `docker compose --env-file /opt/toolyo-pru/.env pull` → descarga la
     imagen exacta de la versión desde GHCR.
   - Ejecuta `prisma migrate deploy` (como servicio efímero o paso
     pre-up) contra la BD de PRU.
   - `docker compose up -d` → levanta la nueva versión.
   - Healthcheck post-deploy contra `/api/health`.
3. **notify** — comenta en el GitHub Release del repo APP (vía API) que la
   versión fue desplegada en PRU (trazabilidad cruzada).

> **Nota sobre SSH:** si el runner y la VM de PRU son la misma máquina, no
> hace falta SSH. Si son máquinas distintas en la intranet, el runner usa
> SSH interno (LAN) con clave o agente — sin exposición a internet.

Secretos del environment `pru` (repo DEPLOY): URL de BD de PRU,
`AUTH_SECRET` de PRU, etc. **Nunca** credenciales de PRO.

### 5.4 Repo DEPLOY — workflow `deploy-pro.yml`

Estructura análoga a `deploy-pru.yml` pero con environment `pro` y el
mecanismo específico del proveedor cloud cuando se elija. **Esqueleto
pendiente** hasta decidir proveedor.

Principios que ya se fijan:

- Mismo patrón dispatch + input de versión.
- Environment `pro` con sus propios secretos, separados de `pru`.
- **Approval required** en el environment `pro` (GitHub Environments lo
  soporta nativamente) — despliegue a PRO requiere aprobación manual.
- Rollback = re-ejecutar el workflow con una versión anterior.

### 5.5 Diagrama de flujo

```
[repo APP]                          [repo DEPLOY]
   │                                    │
   │ push/PR ──> ci.yml                  │
   │   (lint+test)                      │
   │                                    │
   │ git tag v1.2.0                      │
   │   ──> release.yml                   │
   │        ├─ build Docker image        │
   │        ├─ push GHCR :1.2.0          │
   │        └─ GitHub Release            │
   │                                    │
   │                                    │  dispatch(version=1.2.0)
   │                                    │   ──> deploy-pru.yml
   │                                    │        ├─ runs-on: self-hosted,pru
   │                                    │        ├─ resolve digest (GHCR API)
   │                                    │        ├─ docker compose pull
   │                                    │        ├─ migrate deploy
   │                                    │        ├─ compose up -d
   │                                    │        └─ healthcheck
   │                                    │
   │                                    │  dispatch(version=1.2.0)
   │                                    │   ──> deploy-pro.yml (TBD)
   │                                    │        └─ (proveedor cloud)
```

### 5.6 Self-hosted runner para PRU

**Decisión:** PRU usa un **self-hosted runner** instalado en la intranet,
etiquetado `pru`. El runner hace polling saliente a GitHub Actions por
trabajo pendiente — **no requiere puertos entrantes abiertos ni exposición
a internet**.

#### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (cloud)                                 │
│  dispatch(version=1.2.0) ──> encola job con label "pru" │
└────────────────────────┬────────────────────────────────┘
                         │ polling saliente (HTTPS 443)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Intranet — máquina del runner                          │
│  ┌──────────────────────┐    ┌───────────────────────┐  │
│  │  GitHub Actions agent │───>│  Docker Engine        │  │
│  │  (runner.sh / svc)    │    │  compose pull && up   │  │
│  └──────────────────────┘    └───────────────────────┘  │
│                              ┌───────────────────────┐  │
│                              │  PostgreSQL + PostGIS │  │
│                              │  (volumen persistente)│  │
│                              └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

> El runner y la VM de PRU pueden ser **la misma máquina** (lo más simple)
> o máquinas distintas en la misma LAN. Si son distintas, el runner invoca
> `docker compose` vía SSH interno de la intranet (sin tocar internet).

#### Instalación del runner

1. **En GitHub**: Settings del repo DEPLOY → Actions → Runners →
   "New self-hosted runner". Elegir OS (Linux recomendado) y arquitectura.
2. **En la máquina intranet**: seguir las instrucciones descargadas:
   ```bash
   # Crear usuario dedicado (no root)
   sudo useradd -m -s /bin/bash github-runner
   sudo usermod -aG docker github-runner

   # Descargar y configurar
   mkdir /home/github-runner/actions-runner && cd $_
   tar xzf ../actions-runner-linux-x64-*.tar.gz
   ./config.sh --url https://github.com/<owner>/Toolyo-deploy \
     --token <TOKEN> \
     --name pru-runner \
     --labels self-hosted,pru \
     --unattended
   ```
3. **Instalar como servicio** (auto-arranque al encender la máquina):
   ```bash
   sudo ./svc.sh install github-runner
   sudo ./svc.sh start
   ```
4. **Verificar**: en GitHub, Settings → Actions → Runners, el runner debe
   aparecer como **Idle** (verde).

#### Gestión de máquina no siempre encendida

El runner no necesita estar 24/7. Comportamiento:

- **Máquina apagada**: GitHub encola el job. Cuando el runner arranque,
  recoge el job pendiente y lo ejecuta. Los jobs esperan indefinidamente
  (hasta 24h por defecto en self-hosted runners).
- **Máquina encendida on-demand**: encender → el servicio auto-arranca →
  el runner hace polling → ejecuta jobs pendientes.
- **Procedimiento de deploy**:
  1. Encender la máquina de PRU.
  2. Lanzar `workflow_dispatch` desde GitHub (o tenerlo ya lanzado).
  3. El runner ejecuta el deploy.
  4. Verificar healthcheck.
  5. Apagar la máquina cuando no se necesite.

> **Timeout**: si un job lleva más de 24h en cola sin que el runner lo
> recoja, GitHub lo cancela. Si se necesita más ventana, se puede ajustar
> `timeout-minutes` en el workflow o simplemente re-lanzar el dispatch.

#### Seguridad del runner

- El runner **solo** ejecuta workflows del repo DEPLOY, nunca del repo APP.
- Etiqueta `pru` exclusiva: los workflows `runs-on: [self-hosted, pru]`
  solo se asignan a este runner. No comparte con `pro`.
- Usuario `github-runner` con acceso a Docker pero **sin sudo**.
- La máquina no expone puertos entrantes. Todo el tráfico es saliente
  (HTTPS 443 a GitHub + HTTPS 443 a GHCR para `docker pull`).
- **Rotación del token de registro**: si el token de configuración se
  compromete, se puede eliminar el runner desde GitHub y re-registrarlo.

---

## 6. Ciclos de vida independientes

| Evento | Repo afectado | ¿Reconstruye imagen? | ¿Requiere redeploy? |
|--------|---------------|----------------------|---------------------|
| Fix en desarrollo | APP | No | No |
| Nuevo tag `v1.3.0` | APP | Sí (nueva imagen) | No automáticamente |
| Promover `1.3.0` a PRU | DEPLOY | No (usa imagen existente) | Sí |
| Re-desplegar `1.2.0` en PRU (rollback) | DEPLOY | No | Sí |
| Promover `1.3.0` a PRO | DEPLOY | No | Sí, con approval |
| Hotfix config en PRU (`.env`) | DEPLOY | No | Sí (restart) |

**Invariante:** una misma imagen `1.2.0` puede desplegarse en PRU hoy, en PRO
mañana, y de nuevo en PRU dentro de un mes — siempre con idéntico
comportamiento binario. La única diferencia entre entornos es la
configuración (env vars) y la infraestructura subyacente.

---

## 7. Gestión de secretos y configuración

- **LOCAL:** `.env` local, copia de `.env.example`. Sin secretos reales.
- **PRU:** GitHub Actions secrets del environment `pru` en repo DEPLOY. En
  runtime, la VM los materializa en `/opt/toolyo-pru/.env` (gestionado fuera
  del repo) o se inyectan vía `docker compose` con `env_file`.
- **PRO:** idem con environment `pro`. Separados de `pru`.

Reglas:

- Ningún `.env` con valores reales se commitea (ya cubierto por `.gitignore`
  con `.env*` + `!.env.example`).
- Los secretos viven **solo** en GitHub. El repo DEPLOY referencia nombres de
  secretos, no valores.
- Rotación de `AUTH_SECRET` / `OTP_SECRET` documentada como runbook en repo
  DEPLOY (rotar implica invalidar sesiones activas).

---

## 8. Trazabilidad

Para cada despliegue registrado debe poder responderse:

1. **Qué** versión SemVer se desplegó.
2. **Qué** digest SHA256 de imagen exacta.
3. **Qué** migraciones Prisma se aplicaron (hash del árbol de migraciones).
4. **Quién** lanzó el dispatch (actor de GitHub).
5. **Cuándo** (timestamp del workflow run).
6. **En qué** entorno (`pru` / `pro`).
7. **Desde qué** commit/tag del repo APP proviene la imagen.

Los puntos 1, 3 y 7 provienen del GitHub Release del repo APP. Los puntos 2,
4, 5, 6 del workflow run del repo DEPLOY. El job `notify` (§5.3) enlaza
ambos dejando un comentario en el Release.

---

## 9. Pendientes / decisiones abiertas

| # | Pendiente | Bloquea | Propuesta |
|---|-----------|---------|-----------|
| 1 | Crear `development/Dockerfile` multi-stage con standalone | Release pipeline | Definir en siguiente iteración |
| 2 | Configurar `output: "standalone"` en `next.config.mjs` | #1 | Edición mínima |
| 3 | Crear repo `Toolyo-deploy` | Pipeline de deploy | Acción manual del owner |
| 4 | Habilitar GHCR en la cuenta/org de GitHub | Release pipeline | Settings del owner |
| 5 | Definir endpoint `/api/health` | Healthcheck post-deploy | Mínimo: `200 {status:"ok"}` |
| 6 | Decidir proveedor cloud para PRO | `deploy-pro.yml` | Pendiente negocio |
| 7 | ~~Decidir si PRU usa runner self-hosted (intranet) o runner cloud con VPN/SSH a la VM~~ **RESUELTO: self-hosted runner en intranet** (ver §5.6) | ~~`deploy-pru.yml`~~ | ✅ Self-hosted runner etiquetado `pru`, máquina gestionada on-demand |
| 8 | Política de retención de imágenes en GHCR | Coste/limpieza | Definir al confirmar cadencia de releases |
| 9 | Estrategia de BD para PRO (gestionada vs self-hosted) | `deploy-pro.yml` | Ligada a #6 |
| 10 | Observabilidad (Sentry, logs, métricas) | Operativa de PRO | `docs/03` propone candidatos |

---

## 10. Resumen ejecutivo

- **Tres entornos:** LOCAL (cada dev, `npm run dev`, sin versionar), PRU
  (intranet, Docker Compose en VM, versiones SemVer), PRO (cloud TBD,
  versiones SemVer con approval).
- **Dos repos:** APP (este, construye y publica imagen Docker en GHCR por
  git tag SemVer) y DEPLOY (nuevo, despliega versiones elegidas vía
  dispatch, con secretos por environment).
- **Un artefacto:** imagen Docker standalone de Next.js, autocontenida con
  sus migraciones Prisma.
- **Una sola plataforma:** GitHub + GitHub Actions + GHCR. Sin piezas
  nuevas externas.
- **PRU vía self-hosted runner:** el deploy a PRU se ejecuta en un runner
  instalado en la intranet (polling saliente, sin puertos entrantes). La
  máquina se gestiona on-demand: se enciende para deploy, se apaga al
  terminar (ver §5.6).
- **Ciclos de vida independientes:** construir una versión y desplegarla son
  actos separados en repos separados, con auditoría cruzada.
