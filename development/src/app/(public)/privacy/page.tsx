import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de Privacidad | Toolyo" };

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <Link href="/">← Volver a Toolyo</Link>
      <p className="form-kicker">Última actualización: 21 de octubre de 2026</p>
      <h1>Política de Privacidad</h1>
      <p>Esta política explica cómo se tratan los datos personales al utilizar Toolyo. El tratamiento se rige por el Reglamento (UE) 2016/679 (RGPD), la normativa española aplicable y los principios de transparencia, minimización y limitación de conservación.</p>

      <h2>1. Responsable y contacto</h2>
      <p>El responsable del tratamiento es el titular de la plataforma Toolyo. La identidad completa y los datos de contacto del responsable deben facilitarse en el aviso legal y en los canales de soporte oficiales de la plataforma. Puedes ejercer tus derechos a través del canal de soporte disponible en tu cuenta.</p>

      <h2>2. Datos que podemos tratar</h2>
      <ul>
        <li>Datos de cuenta y contacto, como correo electrónico, teléfono, nombre visible, contraseña protegida y preferencias de perfil.</li>
        <li>Datos de publicaciones, productos, disponibilidad, solicitudes, reservas, mensajes, valoraciones y operaciones.</li>
        <li>Datos técnicos y de seguridad, como identificadores de sesión, registros de actividad, dispositivo e información necesaria para prevenir abusos.</li>
        <li>Datos de ubicación cuando los proporcionas o autorizas. La ubicación precisa puede ser necesaria para funciones concretas, pero la ficha pública muestra una zona aproximada y no expone la dirección exacta.</li>
        <li>Datos de verificación o pagos únicamente cuando se habiliten esas funciones y según la información específica facilitada en cada flujo.</li>
      </ul>

      <h2>3. Finalidades y bases jurídicas</h2>
      <p>Tratamos los datos para crear y mantener tu cuenta, facilitar publicaciones y alquileres, permitir la comunicación entre usuarios, gestionar pagos cuando estén disponibles y prestar soporte. La base jurídica es la ejecución del contrato o de medidas precontractuales.</p>
      <p>También tratamos datos para proteger el servicio, prevenir fraude, resolver incidencias y cumplir obligaciones legales. Esto se basa, según el caso, en nuestro interés legítimo o en el cumplimiento de una obligación legal. Los datos opcionales de marketing solo se utilizan con tu consentimiento, que puedes retirar en cualquier momento.</p>

      <h2>4. Geolocalización y privacidad de las direcciones</h2>
      <p>La ubicación se utiliza para ordenar y mostrar productos cercanos y para funciones de búsqueda. En las fichas públicas se presenta de forma aproximada; la dirección exacta no se muestra públicamente. Solo se compartirá con otra parte cuando sea necesario para una operación y de acuerdo con lo que se indique antes de confirmar. Puedes gestionar el permiso de ubicación desde tu dispositivo y editar o retirar la ubicación guardada desde tu perfil.</p>

      <h2>5. Destinatarios y encargados</h2>
      <p>Los datos pueden comunicarse a otros usuarios en la medida necesaria para mostrar perfiles y gestionar una operación; a proveedores que alojan la plataforma, envían comunicaciones, procesan pagos o prestan servicios técnicos; y a autoridades cuando exista obligación legal. Los proveedores actúan bajo instrucciones y garantías contractuales adecuadas. No vendemos datos personales.</p>

      <h2>6. Transferencias internacionales</h2>
      <p>Si un proveedor trata datos fuera del Espacio Económico Europeo, se aplicarán las garantías previstas por el RGPD, como una decisión de adecuación o cláusulas contractuales tipo, junto con medidas complementarias cuando sean necesarias. La información concreta de proveedores y transferencias debe consultarse en los avisos actualizados de la plataforma.</p>

      <h2>7. Conservación</h2>
      <p>Conservamos los datos mientras la cuenta permanezca activa y durante el tiempo necesario para prestar el servicio. Tras la baja, eliminamos o anonimizamos los datos que ya no sean necesarios. Podemos conservar de forma restringida datos de operaciones, facturación, seguridad o reclamaciones durante los plazos legales aplicables; una vez cumplidos, se suprimen o anonimizan.</p>

      <h2>8. Tus derechos</h2>
      <p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad; retirar consentimientos; y no ser objeto de decisiones exclusivamente automatizadas con efectos significativos, cuando corresponda. Estos derechos se conocen tradicionalmente como derechos ARCO, ampliados por el RGPD con limitación y portabilidad. Responderemos en los plazos legales y podremos pedir información razonable para verificar tu identidad.</p>
      <p>También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es/" rel="noreferrer">AEPD</a>) si consideras que el tratamiento no se ajusta a la normativa.</p>

      <h2>9. Seguridad y menores</h2>
      <p>Aplicamos medidas técnicas y organizativas razonables para proteger los datos, aunque ningún sistema conectado a Internet puede garantizar seguridad absoluta. El servicio no está dirigido a menores que no puedan contratar legalmente; si detectamos una cuenta creada sin la edad o autorización exigibles, adoptaremos medidas para eliminarla o restringirla.</p>

      <h2>10. Cambios en esta política</h2>
      <p>Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa. Publicaremos la versión vigente en esta página y, si el cambio es sustancial, lo comunicaremos por un medio adecuado.</p>

      <p>Consulta también los <Link href="/terms">Términos y Condiciones</Link>.</p>
    </article>
  );
}