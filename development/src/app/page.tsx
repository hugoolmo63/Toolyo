import { redirect } from "next/navigation";

/** Redirige la raíz a la página de categorías del scaffold. */
export default function Home() {
  redirect("/categories");
}