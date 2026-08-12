import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// City search-as-you-type, proxied server-side so we can set a proper
// User-Agent (required by Nominatim's usage policy) and avoid CORS issues
// from the Expo client.
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query['q'] ?? '').trim();
  if (q.length < 2) {
    res.json({ results: [] });
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=8&featuretype=city&q=${encodeURIComponent(q)}`;
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'WildflowerApp/1.0 (guided meditation & astrology app)',
        'Accept-Language': 'en',
      },
    });

    if (!upstream.ok) {
      req.log.error({ status: upstream.status }, 'Geocode lookup failed');
      res.status(502).json({ error: 'Geocode lookup failed' });
      return;
    }

    const data = (await upstream.json()) as NominatimResult[];
    const results = data.map((r) => ({
      displayName: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }));
    res.json({ results });
  } catch (err) {
    req.log.error({ err }, 'Failed to reach geocoding service');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
