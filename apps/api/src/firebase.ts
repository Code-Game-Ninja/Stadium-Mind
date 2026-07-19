import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { isAbsolute, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

// Hosts like Render/Railway/Fly don't let you drop a service-account JSON file
// next to the app the way local dev does. FIREBASE_SERVICE_ACCOUNT_BASE64 lets
// you paste the whole service-account JSON (base64-encoded) as a single env
// var instead; it's decoded to a temp file once at boot and
// GOOGLE_APPLICATION_CREDENTIALS is pointed at that path, so every other
// USE_FIREBASE check (keyed on GOOGLE_APPLICATION_CREDENTIALS) keeps working
// unchanged. Local dev is unaffected — it still uses the file path directly.
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (b64 && !process.env.GOOGLE_APPLICATION_CREDENTIALS_RESOLVED) {
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    JSON.parse(json); // fail fast if the value isn't valid JSON once decoded
    const tempPath = resolve(tmpdir(), 'firebase-service-account.json');
    writeFileSync(tempPath, json, { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
    process.env.GOOGLE_APPLICATION_CREDENTIALS_RESOLVED = 'true';
    console.log('[firebase] Loaded service account from FIREBASE_SERVICE_ACCOUNT_BASE64.');
  } catch (err) {
    console.error('[firebase] FIREBASE_SERVICE_ACCOUNT_BASE64 is set but could not be decoded as JSON:', (err as Error).message);
  }
}

// GOOGLE_APPLICATION_CREDENTIALS is usually a relative path in .env
// (./firebase-service-account.json). Resolve it against the api package dir so
// the server works no matter which directory it was launched from.
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credPath && !isAbsolute(credPath) && !existsSync(credPath)) {
  const anchored = resolve(__dirname, '..', credPath);
  if (existsSync(anchored)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = anchored;
  } else {
    console.error(`[firebase] Credential file not found at "${credPath}" or "${anchored}".`);
  }
}

// Make sure we only initialize the app once
if (!getApps().length) {
  try {
    // We expect the user to provide a service account JSON file.
    // They can set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    initializeApp({
      credential: applicationDefault(),
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin. Please provide a service account JSON and set GOOGLE_APPLICATION_CREDENTIALS in your .env', error);
  }
}

export const db = getFirestore();
// Optional fields (email, note, assignedZoneCode, …) may be undefined — skip them
// instead of throwing on write.
db.settings({ ignoreUndefinedProperties: true });
export const auth = getAuth();
