export function needEnv(key: string): string {
  const v = (import.meta as any).env?.[key] as string | undefined;
  if (!v || v.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(`Missing required env: ${key}`);
  }
  return v || '';
}


