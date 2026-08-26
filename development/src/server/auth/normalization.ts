export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string | null {
  const compact = phone.trim().replace(/[\s().-]/g, "");
  const international = compact.startsWith("+") ? compact : `+34${compact}`;
  return /^\+[1-9]\d{7,14}$/.test(international) ? international : null;
}
