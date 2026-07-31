const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateRequestId(
  incoming: string | null,
  generate: () => string = () => crypto.randomUUID()
): string {
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : generate();
}

