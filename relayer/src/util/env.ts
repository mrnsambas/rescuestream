export function needEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}


