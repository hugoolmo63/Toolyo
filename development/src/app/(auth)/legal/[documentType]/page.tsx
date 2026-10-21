import { notFound } from "next/navigation";
import Link from "next/link";

const documents = {
  terms: { title: "Términos y Condiciones", href: "/terms", description: "Consulta los términos completos del servicio de intermediación entre particulares." },
  privacy: { title: "Política de Privacidad", href: "/privacy", description: "Consulta la información completa sobre el tratamiento de tus datos personales y tus derechos." },
} as const;

export default function LegalDocumentPage({ params }: { params: { documentType: string } }) {
  const document = documents[params.documentType as keyof typeof documents];
  if (!document) notFound();
  return <main className="legal-page"><Link href="/register">← Volver al registro</Link><p className="form-kicker">Información legal</p><h1>{document.title}</h1><p>{document.description}</p><p><Link href={document.href}>Leer {document.title}</Link></p></main>;
}
