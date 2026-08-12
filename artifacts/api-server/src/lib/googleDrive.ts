import { google } from 'googleapis';
import type { GaxiosResponse } from 'gaxios';

// Replaces Replit's ReplitConnectors('google-drive') abstraction, which
// handled Drive OAuth for you automatically as long as this ran on Replit.
// Off Replit, we authenticate with a dedicated Google Cloud service account
// instead -- share the specific Drive folder containing the app's audio/
// image assets with that service account's email, and it gets read access
// to just those files, nothing else in anyone's personal Drive.
//
// Required env var: GOOGLE_SERVICE_ACCOUNT_KEY -- the full JSON key file
// for the service account, as a single-line string (see setup notes below).
function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY must be set to the service account JSON key (as a string).',
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }
}

let cachedAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

function getAuth() {
  if (!cachedAuth) {
    cachedAuth = new google.auth.GoogleAuth({
      credentials: getServiceAccountCredentials(),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
  }
  return cachedAuth;
}

export interface DriveStreamResult {
  ok: boolean;
  status: number;
  headers: Map<string, string>;
  body: NodeJS.ReadableStream | null;
  text: () => Promise<string>;
}

// Mirrors the shape the old `connectors.proxy(...)` result had (ok/status/
// headers/body), so audio.ts and images.ts barely need to change below this
// function's call site.
export async function fetchDriveFile(fileId: string, rangeHeader?: string): Promise<DriveStreamResult> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  try {
    const response: GaxiosResponse<NodeJS.ReadableStream> = await drive.files.get(
      { fileId, alt: 'media' },
      {
        responseType: 'stream',
        headers: rangeHeader ? { Range: rangeHeader } : undefined,
      },
    );

    const headers = new Map<string, string>();
    for (const [key, value] of Object.entries(response.headers ?? {})) {
      if (typeof value === 'string') headers.set(key.toLowerCase(), value);
    }

    return {
      ok: true,
      status: response.status,
      headers,
      body: response.data,
      text: async () => '',
    };
  } catch (err: any) {
    // googleapis throws on non-2xx rather than returning a response object,
    // so we normalize that back into the same ok:false shape the old
    // connectors.proxy() call used, to keep the route handlers unchanged.
    const status = err?.response?.status ?? err?.code ?? 500;
    const detail =
      typeof err?.response?.data === 'string'
        ? err.response.data
        : JSON.stringify(err?.response?.data ?? err?.message ?? 'Unknown error');
    return {
      ok: false,
      status: typeof status === 'number' ? status : 500,
      headers: new Map(),
      body: null,
      text: async () => detail,
    };
  }
}
