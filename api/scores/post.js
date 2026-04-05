const ALLOWED_ORIGINS = [
  'https://juahtjeeh.github.io',
  'https://puzzle-delta-three.vercel.app',
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const originAllowed = ALLOWED_ORIGINS.includes(origin);

  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (origin && !originAllowed) {
    return res.status(403).json({ error: 'Niet toegestaan' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nickname, level, time_seconds } = req.body;

  if (!nickname || !level || !time_seconds) {
    return res.status(400).json({ error: 'Nickname, level en time_seconds zijn verplicht' });
  }

  if (typeof nickname !== 'string' || nickname.length < 1 || nickname.length > 20) {
    return res.status(400).json({ error: 'Nickname moet tussen 1 en 20 tekens zijn' });
  }

  if (!/^[a-zA-Z0-9]+$/.test(nickname)) {
    return res.status(400).json({ error: 'Nickname mag alleen letters en cijfers bevatten' });
  }

  if (![8, 16, 32, 64].includes(Number(level))) {
    return res.status(400).json({ error: 'Ongeldig level' });
  }

  if (typeof time_seconds !== 'number' || time_seconds < 1 || time_seconds > 86400) {
    return res.status(400).json({ error: 'Ongeldige tijd' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';

  const rateLimitRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/check_rate_limit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
      },
      body: JSON.stringify({ client_ip: clientIp, client_level: Number(level) })
    }
  );

  const allowed = await rateLimitRes.json();
  if (!allowed) {
    return res.status(429).json({ error: 'Te veel scores ingediend, probeer het later opnieuw' });
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/highscores`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        nickname: nickname.trim(),
        level: Number(level),
        time_seconds: Number(time_seconds)
      })
    }
  );

  if (!response.ok) return res.status(500).json({ error: 'Opslaan mislukt' });
  return res.status(201).json({ success: true });
}
