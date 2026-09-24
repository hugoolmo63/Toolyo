import HomePage from "@/app/page";

/**
 * /search — alias de la landing de búsqueda pública (004-public-search).
 * La implementación vive en src/app/page.tsx; esta ruta existe para que los
 * enlaces a /search no devuelvan 404. Debe vivir fuera del grupo (public)
 * porque SearchPage ya incluye PublicHeader.
 */
export default HomePage;
