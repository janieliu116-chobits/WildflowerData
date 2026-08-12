import { Router } from 'express';
import type { Request, Response } from 'express';
import { fetchDriveFile } from '../lib/googleDrive';
import { ALLOWED_AUDIO_FILE_IDS } from './audioAllowlist';

const router = Router();

// Streams a Google Drive audio file's bytes through the server so the client
// never needs its own Drive OAuth token. `fileId` is the Drive file's ID.
// Only IDs in ALLOWED_AUDIO_FILE_IDS (the app's known track list) may be
// proxied -- this endpoint must never act as an open relay for any file the
// connected Drive account can see.
router.get('/:fileId', async (req: Request, res: Response): Promise<void> => {
  const fileId = String(req.params['fileId'] ?? '');
  if (!fileId || !/^[\w-]+$/.test(fileId) || !ALLOWED_AUDIO_FILE_IDS.has(fileId)) {
    res.status(404).json({ error: 'unknown audio file' });
    return;
  }

  try {
    const range = req.header('range');
    const upstream = await fetchDriveFile(fileId, range);

    // Pass through the upstream status as-is (200/206 success, 404/403/416
    // etc. failure) so the client can distinguish recoverable conditions
    // (e.g. an out-of-range seek) from real errors, instead of collapsing
    // everything non-2xx into a generic 502.
    if (!upstream.ok && upstream.status !== 206) {
      req.log.warn({ status: upstream.status, fileId }, 'Drive audio proxy returned non-2xx');
      res.status(upstream.status);
      const errBody = await upstream.text().catch(() => '');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to fetch audio from Google Drive', status: upstream.status, detail: errBody.slice(0, 500) }));
      return;
    }

    res.status(upstream.status);
    const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    for (const h of passthroughHeaders) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    if (!upstream.headers.get('accept-ranges')) res.setHeader('accept-ranges', 'bytes');

    const body = upstream.body;
    if (!body) {
      res.end();
      return;
    }
    body.pipe(res);
    body.on('error', (err: unknown) => {
      req.log.error({ err, fileId }, 'Drive audio stream errored mid-response');
      res.end();
    });
  } catch (err) {
    req.log.error({ err, fileId }, 'Failed to stream Drive audio');
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    else res.end();
  }
});

export default router;
