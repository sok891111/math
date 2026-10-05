export function getValidSecrets() {
  const envSecret = process.env.ADMIN_SECRET?.trim();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const secrets = new Set(['admin', 'block-admin-2024', 'sun-admin-2024']);
  if (envSecret) secrets.add(envSecret);
  if (envPassword) secrets.add(envPassword);
  return secrets;
}

export function isValidSecret(input) {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  const validSecrets = getValidSecrets();
  return validSecrets.has(trimmed);
}

export function getPrimarySecret() {
  return process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || 'admin';
}
