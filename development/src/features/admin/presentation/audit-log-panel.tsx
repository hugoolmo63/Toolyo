"use client";

export function AuditLogPanel({ logs }: { logs: Array<{ id: string; procedure: string; action: string; outcome: string; createdAt: Date | string }> }) {
  return <section aria-label="Registro de auditoría"><h2>Registro de auditoría</h2>{logs.length === 0 ? <p role="status">No hay eventos de auditoría.</p> : <ol>{logs.map((log) => <li key={log.id}><strong>{log.procedure}</strong> — {log.action} — {log.outcome} — {new Date(log.createdAt).toLocaleString("es-ES")}</li>)}</ol>}</section>;
}