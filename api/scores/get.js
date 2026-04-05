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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (origin && !originAllowed) {
    return res.status(403).json({ error: 'Niet toegestaan' });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { level } = req.query;
  if (!level) return res.status(400).json({ error: 'Level is verplicht' });

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/highscores?level=eq.${level}&order=time_seconds.asc&limit=10`,
    {
      headers: {
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
      }
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}
