export function isSessionVersionValid(tokenVersion: unknown, currentVersion: number): boolean {
  return typeof tokenVersion === "number" && Number.isInteger(tokenVersion) && tokenVersion === currentVersion;
}
