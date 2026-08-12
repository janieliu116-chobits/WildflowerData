import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.9 },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, errText }, 'Gemini API error');
      return res.status(502).json({ error: 'Gemini API request failed' });
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const interpretation = ensureCompletesentences(raw);
    return res.json({ interpretation });
  } catch (err) {
    req.log.error({ err }, 'Failed to call Gemini API');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

/**
 * Trims a Gemini response to the last complete sentence so that a
 * MAX_TOKENS stop or any other mid-sentence truncation never reaches
 * the client. A sentence is considered complete when it ends with
 * '.', '!', '?', or a closing quotation mark following one of those.
 */
function ensureCompletesentences(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return trimmed;
  const last = trimmed[trimmed.length - 1];
  // Already ends on a sentence boundary — return as-is.
  if (['.', '!', '?', '\u2019', '\u201d', '"'].includes(last)) return trimmed;
  // Find the last sentence-ending punctuation in the text.
  let idx = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i];
    if (ch === '.' || ch === '!' || ch === '?') { idx = i; break; }
    // Allow a closing quote right after sentence-end punctuation.
    if ((ch === '\u2019' || ch === '\u201d' || ch === '"') && i > 0) {
      const prev = trimmed[i - 1];
      if (prev === '.' || prev === '!' || prev === '?') { idx = i; break; }
    }
  }
  return idx >= 0 ? trimmed.substring(0, idx + 1) : trimmed;
}
