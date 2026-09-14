/**
 * Parses CORS_ORIGIN and adds http/https plus www/apex variants.
 * Coolify often serves both schemes while the env var lists only one.
 */
export const expandCorsOrigins = (raw: string): string[] => {
  const origins = new Set<string>();

  const add = (value: string) => {
    const origin = value.trim().replace(/\/$/, "");
    if (origin) {
      origins.add(origin);
    }
  };

  for (const part of raw.split(",")) {
    add(part);
    try {
      const url = new URL(part.trim());
      const { host, hostname, protocol } = url;
      const altHostname = hostname.startsWith("www.")
        ? hostname.slice(4)
        : `www.${hostname}`;
      const port = url.port ? `:${url.port}` : "";
      const altHost = `${altHostname}${port}`;
      const schemes =
        protocol === "https:"
          ? ["https:", "http:"]
          : protocol === "http:"
            ? ["http:", "https:"]
            : [protocol];

      for (const scheme of schemes) {
        add(`${scheme}//${host}`);
        add(`${scheme}//${altHost}`);
      }
    } catch {
      // Ignore values that are not absolute origins.
    }
  }

  return [...origins];
};
