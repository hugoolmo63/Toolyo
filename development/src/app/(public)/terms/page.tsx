import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos y Condiciones | Toolyo" };

export default function TermsPage() {
  return (
    <article className="legal-page">
      <Link href="/">← Volver a Toolyo</Link>
      <p className="form-kicker">Última actualización: 21 de octubre de 2026</p>
      <h1>Términos y Condiciones del Servicio</h1>
      <p>Estos términos regulan el acceso y uso de Toolyo, una plataforma digital que facilita el contacto y la gestión de alquileres entre particulares.</p>

      <h2>1. Servicio de intermediación</h2>
      <p>Toolyo pone a disposición herramientas para publicar productos, descubrir ofertas, comunicarse y tramitar solicitudes de alquiler. Salvo que una pantalla indique expresamente lo contrario, Toolyo no es propietaria de los productos ni parte del contrato de alquiler entre quien publica (arrendador) y quien alquila (arrendatario). Las condiciones particulares del alquiler se acuerdan entre esas personas.</p>

      <h2>2. Cuenta y requisitos de uso</h2>
      <p>Debes facilitar información veraz, mantener protegidas tus credenciales y utilizar una cuenta personal. Eres responsable de la actividad realizada desde tu cuenta y de mantener actualizados tus datos de contacto. Podemos limitar o suspender el acceso cuando sea necesario para proteger a las personas usuarias, investigar un uso abusivo o cumplir la ley.</p>

      <h2>3. Publicaciones y obligaciones de las personas usuarias</h2>
      <p>El arrendador debe tener derecho a ofrecer el producto, describirlo con exactitud, indicar su disponibilidad y precio, mantenerlo en condiciones seguras y cumplir las obligaciones fiscales, de consumo y demás normas que le sean aplicables. No se pueden publicar productos ilegales, peligrosos, falsos o cuya oferta infrinja derechos de terceros.</p>
      <p>El arrendatario debe revisar la descripción, resolver sus dudas antes de confirmar, cuidar el producto y devolverlo en el estado y plazo acordados, salvo el desgaste normal. Ambas partes deben comunicarse con respeto y cumplir las condiciones que hayan aceptado.</p>

      <h2>4. Solicitudes, pagos y cancelaciones</h2>
      <p>Una solicitud no constituye una reserva confirmada hasta que la plataforma lo indique. Antes de confirmar, se mostrarán el precio, cargos aplicables y las condiciones de cancelación disponibles para esa operación. Las cancelaciones, reembolsos, retrasos, daños o desacuerdos se resolverán conforme a esas condiciones y a la normativa aplicable; contactar con Toolyo no sustituye los derechos legales de las partes.</p>
      <p>Si Toolyo habilita pagos, los proveedores de pago procesarán las operaciones según sus propias condiciones. Toolyo no garantiza que una cancelación dé derecho a un reembolso fuera de las condiciones presentadas o de los derechos imperativos aplicables.</p>

      <h2>5. Seguridad, confianza y seguros</h2>
      <p>Las verificaciones, valoraciones y demás indicadores son ayudas informativas; no garantizan la identidad, conducta, calidad del producto ni cumplimiento de una operación. La existencia y alcance de cualquier cobertura de seguro dependerán de las condiciones específicas que se presenten para la reserva. No se debe asumir que un alquiler está asegurado si no se indica expresamente.</p>

      <h2>6. Uso aceptable y disponibilidad</h2>
      <p>No debes usar el servicio para fraude, acoso, discriminación, elusión de medidas de seguridad, distribución de contenido ilícito o acceso no autorizado. Podemos retirar contenido que incumpla estos términos y adoptar medidas proporcionadas. Procuramos mantener el servicio disponible, pero puede interrumpirse temporalmente por mantenimiento, seguridad o causas ajenas a nuestro control.</p>

      <h2>7. Responsabilidad</h2>
      <p>En la medida permitida por la ley, cada persona usuaria responde por sus publicaciones, producto, acuerdos y obligaciones frente a la otra parte. Toolyo no responde por la custodia, estado, entrega o devolución de productos ni por acuerdos celebrados directamente entre usuarios. Nada de estos términos excluye responsabilidades que legalmente no puedan excluirse, ni limita los derechos reconocidos a consumidores por normas imperativas.</p>

      <h2>8. Propiedad intelectual y contenido</h2>
      <p>Conservas los derechos sobre el contenido que publicas. Nos autorizas a alojarlo y mostrarlo en la medida necesaria para prestar, proteger y promocionar el servicio dentro de tus preferencias de publicación. No debes subir contenido del que no tengas derechos o que vulnere la privacidad de otras personas.</p>

      <h2>9. Baja de la cuenta y cambios</h2>
      <p>Puedes solicitar la baja desde la configuración de tu perfil. La baja desactiva el acceso; determinados datos y registros podrán conservarse bloqueados cuando exista una obligación legal, una operación pendiente o la necesidad de defender reclamaciones. Podemos actualizar estos términos; notificaremos los cambios relevantes y solicitaremos una nueva aceptación cuando la ley lo exija.</p>

      <h2>10. Legislación y contacto</h2>
      <p>Se aplicará la legislación que corresponda conforme a las normas imperativas de protección de consumidores y usuarios. Para consultas o reclamaciones, utiliza los canales de soporte disponibles en la plataforma. La información de identificación y contacto del titular del servicio debe consultarse en los avisos legales que Toolyo publique para la jurisdicción de prestación.</p>

      <p>La Política de Privacidad está disponible en <Link href="/privacy">/privacy</Link>.</p>
    </article>
  );
}