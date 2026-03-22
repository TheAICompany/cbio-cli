import * as http from "node:http";

function normalizeProxyRequestHeaders(headers: http.IncomingHttpHeaders) {
  const next = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length" || lower === "connection" || lower === "authorization") {
      continue;
    }
    next.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  next.set("x-cbio-local-proxy", "1");
  return next;
}

async function readRequestBody(req: http.IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
}

export function validateUpstreamUrl(rawUrl: string): string {
  const upstreamBaseUrl = rawUrl.trim();

  try {
    const parsed = new URL(upstreamBaseUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return upstreamBaseUrl;
    }
  } catch {
    // Fall through to shared error path below.
  }

  throw new Error(`❌ Invalid upstream URL: "${rawUrl}". Must be a valid http:// or https:// URL.`);
}

export function resolveProxyPort(): number {
  const port = process.env.C_BIO_PROXY_PORT ? Number(process.env.C_BIO_PROXY_PORT) : 0;
  if (Number.isNaN(port)) {
    throw new Error("❌ Error: C_BIO_PROXY_PORT must be a valid number.");
  }
  return port;
}

export async function startProxy(secretValue: string, upstreamBaseUrl: string, secretName: string, port: number) {
  const upstream = new URL(upstreamBaseUrl);
  const server = http.createServer(async (req, res) => {
    try {
      const method = (req.method ?? "GET").toUpperCase();
      const targetUrl = new URL(req.url ?? "/", upstream);
      const headers = normalizeProxyRequestHeaders(req.headers);
      headers.set("Authorization", `Bearer ${secretValue}`);
      const body = await readRequestBody(req);

      const upstreamResponse = await fetch(targetUrl.toString(), {
        method,
        headers,
        body: body as BodyInit | undefined,
      });

      res.statusCode = upstreamResponse.status;
      upstreamResponse.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower === "content-length" || lower === "transfer-encoding" || lower === "connection") {
          return;
        }
        res.setHeader(key, value);
      });
      res.end(Buffer.from(await upstreamResponse.arrayBuffer()));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "CBIO_LOCAL_PROXY_UPSTREAM_FAILED",
        message,
      }));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to determine local proxy address.");
  }

  return {
    secretName,
    upstreamBaseUrl,
    host: "127.0.0.1",
    port: address.port,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve());
      });
    },
  };
}
