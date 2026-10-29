const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com", "10minutemail.net", "guerrillamail.com", "guerrillamail.net",
  "tempmail.com", "tempmail.net", "temp-mail.org", "throwaway.email", "mailinator.com",
  "yopmail.com", "getnada.com", "sharklasers.com", "grr.la", "dispostable.com",
]);

function hasRandomLocalPart(localPart: string) {
  const normalized = localPart.toLowerCase().replace(/[._+-]/g, "");
  if (normalized.length < 16 || !/^[a-z]+$/.test(normalized)) return false;
  const counts = new Map<string, number>();
  for (const char of normalized) counts.set(char, (counts.get(char) ?? 0) + 1);
  const entropy = [...counts.values()].reduce((sum, count) => {
    const probability = count / normalized.length;
    return sum - probability * Math.log2(probability);
  }, 0);
  return entropy >= 3.6 && counts.size >= 10;
}

export function isAllowedRegistrationEmail(email: string) {
  const [localPart, domainRaw] = email.trim().toLowerCase().split("@");
  if (!localPart || !domainRaw) return false;
  const domain = domainRaw.replace(/\.$/, "");
  const isDisposable = [...DISPOSABLE_EMAIL_DOMAINS].some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
  return !isDisposable && !hasRandomLocalPart(localPart);
}

export const TEMPORARY_EMAIL_ERROR = "No se permiten direcciones de correo temporales o no válidas.";