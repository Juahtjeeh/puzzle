const ALLOWED_ORIGINS = [
  'https://juahtjeeh.github.io',
  'https://puzzle.vercel.app',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Niet toegestaan' });
  }

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
