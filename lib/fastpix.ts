import { Fastpix } from "@fastpix/fastpix-node";

function createClient() {
  const accessTokenId = process.env.FASTPIX_ACCESS_TOKEN_ID;
  const secretKey = process.env.FASTPIX_SECRET_KEY;

  if (!accessTokenId || !secretKey) {
    throw new Error(
      "Missing FastPix credentials. Copy .env.local.example to .env.local and fill in your credentials."
    );
  }

  return new Fastpix({
    security: { username: accessTokenId, password: secretKey },
  });
}

// Lazy singleton — instantiated on first API call, not at module load time
let _client: Fastpix | null = null;

const fastpix = new Proxy({} as Fastpix, {
  get(_target, prop) {
    if (!_client) _client = createClient();
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default fastpix;
