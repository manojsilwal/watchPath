import admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin(): void {
  if (initialized) return;
  if (admin.apps.length > 0) {
    initialized = true;
    return;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const cred = JSON.parse(raw) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
  } else {
    admin.initializeApp();
  }
  initialized = true;
}

export function getFirebaseAdmin(): typeof admin {
  initFirebaseAdmin();
  return admin;
}
