# Quickstart: Validar la configuración de IP del servidor móvil

## Prerequisites

- Node.js 22 para las herramientas de Capacitor.
- Dependencias instaladas en `development`.
- Un endpoint HTTPS de prueba o un servidor HTTP accesible desde la red local.
- Para validación nativa: Android Studio/emulador o Xcode/simulador iPhone, según la plataforma disponible.

## 1. Configure an internal mobile build

La build debe incluir la interfaz compilada en el paquete nativo (`capacitor/www`). No debe depender de `server.url` remoto para arrancar la interfaz; `MOBILE_SERVER_URL` se utiliza como endpoint de API configurable.

Desde `development`, configurar variables equivalentes a:

```env
MOBILE_SERVER_URL=https://toolyo.example.com
MOBILE_ALLOW_RUNTIME_OVERRIDE=true
MOBILE_ALLOW_CLEARTEXT=false
```

Para una red local de pruebas, usar una dirección como `http://192.168.1.50:3000` y habilitar cleartext solo en la build interna autorizada.

No usar `MOBILE_ALLOW_RUNTIME_OVERRIDE=true` en una build de producción.

## 2. Run automated validation

```bash
cd development
npm test -- --run tests/unit/native/endpoint-config.test.ts
```

Expected outcomes:

- Se normalizan las direcciones válidas.
- Se rechazan valores inválidos.
- Se conservan las reglas HTTPS/cleartext.
- El override local se guarda, recupera y elimina correctamente.
- La plataforma web no expone el control móvil.

Si se añaden pruebas de componente:

```bash
npm exec vitest run tests/unit/native/mobile-endpoint-settings.test.tsx
```

## 3. Validate the Android/iPhone flow

1. Iniciar una build móvil interna con runtime override habilitado.
2. Abrir la aplicación Android o iPhone.
3. Confirmar que el control de configuración está visible.
4. Introducir una dirección válida y guardarla.
5. Confirmar el mensaje de éxito y que el estado de conectividad se reevalúa.
6. Cerrar y abrir la aplicación; verificar que la dirección permanece.
7. Introducir una dirección vacía, con formato inválido y con un servidor inaccesible; verificar que la dirección funcional anterior permanece.
8. Restablecer la configuración y verificar que vuelve al endpoint predeterminado.

## 4. Validate platform isolation

1. Ejecutar la aplicación en web.
2. Acceder a los lugares donde podría aparecer la configuración de conexión.
3. Confirmar que no existe control editable de endpoint ni lectura del override móvil.
4. Verificar que el comportamiento de conexión web no cambia.

## 5. Validate production safety

1. Generar una configuración con `MOBILE_ALLOW_RUNTIME_OVERRIDE=false`.
2. Confirmar que Android/iPhone no permiten editar la dirección.
3. Verificar que un endpoint público HTTP se rechaza para producción.
4. Verificar que no se agregan dominios de navegación comodín.

## Related artifacts

- Reglas de datos y transiciones: [data-model.md](./data-model.md)
- Contrato de la interfaz: [contracts/mobile-endpoint-settings.md](./contracts/mobile-endpoint-settings.md)
- Requisitos: [spec.md](./spec.md)
