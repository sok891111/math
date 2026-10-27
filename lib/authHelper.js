export function getValidSecrets() {
  const envSecret = process.env.ADMIN_SECRET?.trim();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const secrets = new Set();
  if (envSecret) secrets.add(envSecret);
  if (envPassword) secrets.add(envPassword);
  // Deployed parent controls must not be bypassed using published default passwords.
  if (!envSecret && !envPassword && !process.env.VERCEL) secrets.add('admin');
  return secrets;
}

export function isValidSecret(input) {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  const validSecrets = getValidSecrets();
  return validSecrets.has(trimmed);
}

export function getPrimarySecret() {
  return process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || (!process.env.VERCEL ? 'admin' : '');
}
