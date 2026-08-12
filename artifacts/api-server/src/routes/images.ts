import { Router } from 'express';
import type { Request, Response } from 'express';
import { fetchDriveFile } from '../lib/googleDrive';
import { ALLOWED_IMAGE_FILE_IDS } from './imageAllowlist';

const router = Router();

// Streams a Google Drive image file's bytes through the server so the client
// never needs its own Drive OAuth token. `fileId` is the Drive file's ID.
// Only IDs in ALLOWED_IMAGE_FILE_IDS (the app's known Tarot/Lenormand card
// artwork) may be proxied -- this endpoint must never act as an open relay
// for any file the connected Drive account can see.
router.get('/:fileId', async (req: Request, res: Response): Promise<void> => {
  const fileId = String(req.params['fileId'] ?? '');
  if (!fileId || !/^[\w-]+$/.test(fileId) || !ALLOWED_IMAGE_FILE_IDS.has(fileId)) {
    res.status(404).json({ error: 'unknown image file' });
    return;
  }

  try {
    const upstream = await fetchDriveFile(fileId);

    if (!upstream.ok) {
      req.log.warn({ status: upstream.status, fileId }, 'Drive image proxy returned non-2xx');
      res.status(upstream.status);
      const errBody = await upstream.text().catch(() => '');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to fetch image from Google Drive', status: upstream.status, detail: errBody.slice(0, 500) }));
      return;
    }

    res.status(upstream.status);
    const passthroughHeaders = ['content-type', 'content-length'];
    for (const h of passthroughHeaders) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    // Card artwork never changes -- safe to cache aggressively client-side.
    res.setHeader('cache-control', 'public, max-age=604800, immutable');

    const body = upstream.body;
    if (!body) {
      res.end();
      return;
    }
    body.pipe(res);
    body.on('error', (err: unknown) => {
      req.log.error({ err, fileId }, 'Drive image stream errored mid-response');
      res.end();
    });
  } catch (err) {
    req.log.error({ err, fileId }, 'Failed to stream Drive image');
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    else res.end();
  }
});

export default router;
