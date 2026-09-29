import { notFound } from "next/navigation";
import Link from "next/link";

const documents = {
  terms: { title: "Términos y Condiciones", body: "Estos términos regulan el uso de Toolyo y las relaciones entre sus usuarios." },
  privacy: { title: "Política de Privacidad", body: "Explicamos qué datos tratamos, para qué los usamos y cuáles son tus derechos." },
} as const;

export default function LegalDocumentPage({ params }: { params: { documentType: string } }) {
  const document = documents[params.documentType as keyof typeof documents];
  if (!document) notFound();
  return <main className="legal-page"><Link href="/register">← Volver al registro</Link><p className="form-kicker">Documento vigente</p><h1>{document.title}</h1><p>{document.body}</p><p>La versión final de este documento se publicará con la revisión legal de Toolyo.</p></main>;
}
