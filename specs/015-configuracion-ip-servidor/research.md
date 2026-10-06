# Research: Configuración de IP del servidor en aplicaciones móviles

## Decision 1: Mantener la configuración como preferencia local por instalación

**Decision**: Guardar el override del endpoint en el almacenamiento local del dispositivo y no en el backend.

**Rationale**: La especificación define una configuración del entorno de cada instalación, útil para servidores locales, pruebas o producción. Persistirla localmente evita mezclar configuraciones entre usuarios y dispositivos, no requiere autenticación adicional ni cambios de esquema, y coincide con las funciones `getRuntimeOverride`/`setRuntimeOverride` ya presentes.

**Alternatives considered**:
- Guardarla en el perfil del usuario: descartado porque sincronizaría una dirección de red potencialmente distinta entre dispositivos.
- Guardarla únicamente durante el build: descartado porque no permite al usuario cambiar el servidor desde la aplicación.

## Decision 2: Distribuir la interfaz móvil localmente y separar interfaz de API

**Decision**: La aplicación nativa debe cargar la interfaz compilada incluida en el paquete (`capacitor/www`); `MOBILE_SERVER_URL` representará únicamente el endpoint de API y no el origen remoto de la interfaz.

**Rationale**: Si el WebView carga toda la aplicación desde `server.url`, una caída del servidor impide llegar a la pantalla que permitiría cambiar la dirección. Una interfaz incluida localmente elimina esa dependencia circular y permite configurar o corregir el endpoint sin conectividad.

**Alternatives considered**:
- Mantener `server.url` apuntando al servidor configurable: descartado porque bloquea la configuración cuando el servidor no está disponible.
- Añadir una pantalla mínima remota o separada para bootstrap: descartado porque sigue introduciendo una dependencia de red y duplica la experiencia.

## Decision 3: Reutilizar el resolver de endpoint existente como única fuente de comportamiento

**Decision**: Ampliar `src/lib/native/endpoint-config.ts` para centralizar normalización, validación, persistencia, reset y cálculo del endpoint efectivo.

**Rationale**: El proyecto ya resuelve `MOBILE_SERVER_URL`, `MOBILE_ALLOW_RUNTIME_OVERRIDE` y las reglas de cleartext desde ese módulo. Centralizar el nuevo flujo evita que la UI, el shell y el banner de conectividad usen valores diferentes.

**Alternatives considered**:
- Leer directamente `localStorage` desde el componente: descartado porque duplicaría la clave y las reglas de fallback.
- Crear un proveedor de estado global independiente: descartado porque el `NativeShellProvider` ya expone el endpoint efectivo y puede actualizarlo.

## Decision 3: Mostrar la configuración solo cuando la plataforma sea Android o iPhone y el override esté habilitado

**Decision**: Renderizar el control dentro del shell nativo después de detectar `android` o `ios`, y ocultarlo para web. El control también respetará la bandera de runtime override para no habilitar cambios en builds de producción.

**Rationale**: Cumple el alcance exclusivo de la spec y conserva la protección existente que rechaza overrides en producción.

**Alternatives considered**:
- Mostrarlo en la aplicación web: descartado por alcance.
- Permitirlo siempre en las aplicaciones móviles: descartado porque podría debilitar la configuración de producción.

## Decision 4: Validar localmente antes de guardar y comprobar disponibilidad de forma separada

**Decision**: Rechazar antes de persistir valores vacíos, URLs mal formadas, esquemas no permitidos y puertos inválidos. La comprobación de disponibilidad se ejecuta después de la validación; si falla, se conserva el endpoint anterior y se muestra un error accionable.

**Rationale**: El formato es una condición determinista que no requiere red. La disponibilidad depende del entorno del usuario y no debe borrar una configuración que todavía puede ser funcional.

**Alternatives considered**:
- Guardar cualquier texto y dejar que falle la primera petición: descartado porque produce errores ambiguos y puede generar destinos inseguros.
- Requerir que el servidor responda antes de guardar: descartado como regla de formato, aunque el flujo puede ofrecer una prueba de conexión antes de aplicar el cambio.

## Decision 5: Mantener las reglas de seguridad actuales

**Decision**: Los endpoints de producción deben usar HTTPS; HTTP solo puede habilitarse para direcciones de red local en builds internas según las reglas existentes. No se amplían dominios de navegación automáticamente ni se permite `*`.

**Rationale**: La constitución exige seguridad por diseño y el código actual ya diferencia cleartext local de HTTP público y prohíbe runtime override en producción.

**Alternatives considered**:
- Permitir HTTP para cualquier host: descartado por riesgo de interceptación.
- Añadir una lista abierta de hosts permitidos: descartado porque rompe el principio de mínimo privilegio.

## Decision 6: Actualizar el estado del shell y la conectividad tras guardar o restablecer

**Decision**: El `NativeShellProvider` debe exponer una acción o estado que permita recalcular el endpoint efectivo y notificar al banner de conectividad después de un cambio.

**Rationale**: Guardar solo en almacenamiento local no actualiza una aplicación ya abierta. Recalcular explícitamente evita requerir un reinicio para aplicar la configuración.

**Alternatives considered**:
- Aplicar cambios solo al reiniciar: descartado porque la UX no confirma inmediatamente el cambio.
- Recargar toda la aplicación: descartado por ser más disruptivo que actualizar el estado del shell.
