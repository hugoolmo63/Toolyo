"use client";

export function UsersPanel({ users }: { users: Array<{ id: string; email: string; role: string; accountStatus: string }> }) { return <section aria-label="Usuarios administrativos"><h2>Usuarios</h2><ul>{users.map((user) => <li key={user.id}>{user.email} — {user.role} — {user.accountStatus}</li>)}</ul></section>; }