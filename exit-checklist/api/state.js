// Serverless function for the 離職 Checklist (Vercel Node runtime, CommonJS).
//
// Responsibilities:
//   GET  /api/state  -> return the saved checklist state (JSON)
//   POST /api/state  -> overwrite the saved checklist state (last write wins)
//
// Protection: every request must carry the correct passphrase in the
// "x-passphrase" header. The passphrase lives in an environment variable,
// never in the client code, so a public URL alone reveals nothing.
//
// Storage: an Upstash Redis / Vercel KV instance, reached over its REST API.
// The integration injects one of the env-var pairs below when you connect
// the store to this project in the Vercel dashboard.

const crypto = require('crypto');

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PASSPHRASE = process.env.APP_PASSPHRASE;
const DATA_KEY = 'exit-checklist:state';

// Constant-time comparison so we don't leak the passphrase length/prefix
// through response timing.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Send a single Redis command via the Upstash REST API.
async function kv(command) {
  const resp = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!resp.ok) {
    throw new Error('KV request failed: ' + resp.status);
  }
  return resp.json();
}

module.exports = async (req, res) => {
  // Private data: never let a proxy or browser cache it.
  res.setHeader('Cache-Control', 'no-store');

  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({ error: 'storage_not_configured' });
    return;
  }
  if (!PASSPHRASE) {
    res.status(500).json({ error: 'passphrase_not_configured' });
    return;
  }

  const given = req.headers['x-passphrase'];
  if (!given || !safeEqual(given, PASSPHRASE)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const out = await kv(['GET', DATA_KEY]);
      const value = out && out.result ? JSON.parse(out.result) : null;
      res.status(200).json({ state: value });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const incoming = body && body.state;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({ error: 'missing_state' });
        return;
      }
      await kv(['SET', DATA_KEY, JSON.stringify(incoming)]);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
};
