# Proveedores OTP y KYC

## 1. Propósito

Este documento recoge proveedores recomendados para la capa de OTP y para la verificación KYC de Toolyo. Incluye opciones SaaS con referencia de precios públicos y alternativas open source para un enfoque DIY de bajo riesgo.

## 2. Criterios de selección

La selección de proveedor debe priorizar:

- Cumplimiento y seguridad.
- Encaje con la arquitectura actual.
- Cobertura en Europa y, en particular, en España.
- Minimización de datos y trazabilidad.
- Capacidad de escalar sin rediseñar el flujo.

## 3. OTP

### 3.1 Twilio Verify

**Web oficial**: https://www.twilio.com/en-us/user-authentication-identity/verify  
**Pricing**: https://www.twilio.com/en-us/verify/pricing

Twilio Verify es una solución madura para verificación de usuarios. Según su pricing público, el modelo base parte de **$0.05 por verificación exitosa**, con tarifas adicionales por canal según el medio usado. También publica soporte para SMS, WhatsApp, voz, email, Push, TOTP y Silent Network Authentication.

**Puntos fuertes**:

- Cobertura multicanal amplia.
- Ecosistema y documentación maduros.
- Modelo pay-as-you-go claro.
- Buen encaje para productos con crecimiento internacional.

**Referencia de precio público**:

- Base: **$0.05 por verificación exitosa**.
- SMS: **$0.05 por verificación exitosa + $0.0083 por SMS (US)**.
- WhatsApp: **$0.05 por verificación exitosa + $0.0034 por mensaje de plantilla (US)**.
- Voice: **$0.05 por verificación exitosa**.
- Email: **$0.05 por verificación exitosa**.

### 3.2 Vonage Verify

**Web oficial**: https://www.vonage.com/communications-apis/verify/  
**Pricing**: https://www.vonage.com/communications-apis/verify/pricing/

Vonage Verify ofrece OTP y autenticación con varios canales. Su página pública indica soporte para SMS, RCS, WhatsApp, voz, email y Silent Authentication.

**Puntos fuertes**:

- Soporte multicanal con fallback.
- Mensajería y voz integradas.
- Pago solo por verificaciones exitosas en el plan público principal.

**Referencia de precio público**:

- Verify Conversion: **€0.052 / $0.06084 por verificación exitosa**.
- Verify Success: **contact sales** con descuentos por volumen.

### 3.3 Recomendación OTP

Recomendación formal para Toolyo:

- **Proveedor primario**: Twilio Verify.
- **Proveedor alternativo**: Vonage Verify.

Twilio es la opción más directa si se prioriza madurez, documentación y flexibilidad de canales. Vonage es una alternativa sólida si se quiere optimizar el fallback y el coste por verificación exitosa.

## 4. KYC

### 4.1 Sumsub

**Web oficial**: https://sumsub.com/  
**Pricing**: https://www.sumsub.com/pricing/

Sumsub combina verificación de identidad, liveness, screening AML, prueba de domicilio, verificación de email/teléfono, reusable KYC y herramientas de workflow/case management. Es una opción muy alineada con marketplaces y flujos con obligaciones de cumplimiento.

**Referencia de precio público**:

- Basic: **$1.35 por verificación** y **$149 mínimo mensual**.
- Compliance: **$1.85 por verificación** y **$299 mínimo mensual**.
- Enterprise: **contact sales**.

**Puntos fuertes**:

- Cobertura amplia de verificación y cumplimiento.
- Incluye AML y PoA en planes superiores.
- Mejor encaje para marketplace con riesgo regulatorio.

### 4.2 Veriff

**Web oficial**: https://www.veriff.com/identity-verification  
**Pricing**: https://www.veriff.com/pricing

Veriff publica planes self-serve con precios visibles. Su pricing público indica una base de **$0.80 por verificación** en Essential, **$1.39 por verificación** en Plus y **$1.89 por verificación** en Premium, además de mínimos mensuales.

**Referencia de precio público**:

- Essential: **$0.80 por verificación** y **$49 mínimo mensual**.
- Plus: **$1.39 por verificación** y **$99 mínimo mensual**.
- Premium: **$1.89 por verificación** y **$209 mínimo mensual**.
- Enterprise: **contact sales**.

**Puntos fuertes**:

- Verificación documental y biométrica sólida.
- Free trial público y precios self-serve visibles.
- Buen encaje para onboarding con menos complejidad operativa inicial.

### 4.3 Au10tix

**Web oficial**: https://www.au10tix.com/  
**Pricing**: https://www.au10tix.com/pricing/

Au10tix presenta una oferta centrada en verificación de identidad, biometría, OCR, deepfake detection, reusable digital ID y workflow orchestration. Su pricing público muestra un plan **Basic KYC** con **$500 monthly minimum**; el resto del pricing se orienta a contacto comercial.

**Referencia de precio público**:

- Basic KYC: **$500 mínimo mensual**.
- Otros planes: **contact sales**.

**Puntos fuertes**:

- Buen foco en biometría, OCR y detección avanzada.
- Interesante para KYC con flujos más personalizados.

### 4.4 Recomendación KYC

Recomendación formal para Toolyo:

- **Proveedor primario**: Sumsub.
- **Proveedor alternativo**: Veriff.
- **Proveedor a evaluar**: Au10tix si se prioriza orquestación avanzada y biometría.

Sumsub es la opción más completa para un marketplace con potencial exposición a obligaciones AML. Veriff encaja bien como alternativa self-serve con precios públicos claros. Au10tix aporta capacidades fuertes, pero su posicionamiento comercial es menos directo para una implementación inicial simple.

## 5. Alternativas DIY con open source

No existe una alternativa open source que sustituya por completo a un proveedor KYC regulado. La vía DIY debe considerarse solo para prevalidación, prototipos o soporte interno.

### 5.1 OCR y extracción

- **Tesseract**: motor OCR open source maduro.
  - Web: https://github.com/tesseract-ocr/tesseract
- **EasyOCR**: OCR con soporte multilenguaje y uso sencillo.
  - Web: https://github.com/JaidedAI/EasyOCR

### 5.2 Visión y biometría básica

- **OpenCV**: procesamiento de imagen y vídeo.
  - Web: https://github.com/opencv/opencv
- **face_recognition**: comparación facial básica sobre Python.
  - Web: https://github.com/ageitgey/face_recognition

### 5.3 Limitaciones del DIY

Este enfoque no cubre:

- Liveness certificada.
- Screening AML.
- Gestión de evidencias y auditoría de nivel regulatorio.
- Reglas de decisión y casuística operativa avanzada.

Por tanto, no debe usarse como KYC principal en producción regulada.

## 6. Recomendación ejecutiva

La combinación más equilibrada para Toolyo es:

- **OTP**: Twilio Verify.
- **KYC**: Sumsub.
- **DIY open source**: solo como soporte o pre-screening interno.

## 7. Encaje con la arquitectura actual

La base de código ya contempla una abstracción de proveedor para OTP y KYC, por lo que esta selección encaja con la arquitectura existente y puede evolucionar sin rediseñar el dominio.
