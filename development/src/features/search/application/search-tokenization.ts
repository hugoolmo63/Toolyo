/** Normaliza texto para comparar búsquedas sin distinguir mayúsculas ni acentos. */
export function tokenizeSearchText(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Exige que cada término consultado coincida con un token en alguno de los campos. */
export function matchesSearchTokens(queryTokens: string[], ...values: Array<string | null | undefined>): boolean {
  if (queryTokens.length === 0) return false;

  const fieldTokens = values.flatMap((value) => value ? tokenizeSearchText(value) : []);
  return queryTokens.every((queryToken) => fieldTokens.some((fieldToken) => fieldToken.includes(queryToken)));
}