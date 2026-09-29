"use client";

export default function AdminError({ reset }: { reset: () => void }) { return <main role="alert"><p>No se pudo cargar el backoffice.</p><button type="button" onClick={reset}>Reintentar</button></main>; }