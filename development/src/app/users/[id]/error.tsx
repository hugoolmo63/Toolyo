"use client";

export default function PublicUserProfileError({ reset }: { reset: () => void }) {
  return <main className="user-profile-page" role="alert"><h1>No se pudo cargar el perfil</h1><button type="button" className="auth-submit" onClick={reset}>Reintentar</button></main>;
}