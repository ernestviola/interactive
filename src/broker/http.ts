export function allowedLocalRequest(host: string, origin: string | undefined, port: number, trusted: string[] = []): boolean {
  const allowed = [`http://127.0.0.1:${port}`, `http://localhost:${port}`, `http://[::1]:${port}`, ...trusted];
  return allowed.some(value => new URL(value).host === host) && (origin === undefined || allowed.includes(origin));
}
