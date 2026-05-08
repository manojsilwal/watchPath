import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

/** True when all required Firebase web env vars are set (e.g. in .env.local). */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    readEnv('NEXT_PUBLIC_FIREBASE_API_KEY') &&
      readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') &&
      readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured — set NEXT_PUBLIC_FIREBASE_* in apps/web/.env.local');
  }
  if (app) return app;
  const config = {
    apiKey: readEnv('NEXT_PUBLIC_FIREBASE_API_KEY')!,
    authDomain: readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')!,
    projectId: readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')!,
  };
  app = getApps().length ? getApps()[0]! : initializeApp(config);
  return app;
}

/** Returns `null` when Firebase web config is missing (app still works; sign-in is disabled). */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  return auth;
}
