import { isIP } from "net";

export function getClientIp(
  headers: Headers,
  trustProxy = process.env.TRUST_PROXY === "true"
): string {
  if (!trustProxy) return "unknown";

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) return realIp.toLowerCase();

  const forwarded = headers.get("x-forwarded-for");
  const closestAddress = forwarded?.split(",").at(-1)?.trim();
  return closestAddress && isIP(closestAddress)
    ? closestAddress.toLowerCase()
    : "unknown";
}
