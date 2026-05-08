import type { DecodedIdToken } from 'firebase-admin/auth';

import { isAdminEmail } from './admin-allowlist';
import { getFirebaseAdmin } from './firebase-admin';
import { verifySessionToken } from './session-jwt';

export type ResolvedAuth = {
  uid: string;
  email: string;
  admin: boolean;
  source: 'session_jwt' | 'firebase_id_token';
};

function bearer(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function resolveAuth(authorization: string | undefined): Promise<ResolvedAuth | null> {
  const token = bearer(authorization);
  if (!token) return null;

  if (process.env.JWT_SECRET) {
    try {
      const session = verifySessionToken(token);
      return {
        uid: session.sub,
        email: session.email,
        admin: session.admin,
        source: 'session_jwt',
      };
    } catch {
      /* fall through to Firebase */
    }
  }

  try {
    const admin = getFirebaseAdmin();
    const decoded: DecodedIdToken = await admin.auth().verifyIdToken(token);
    const email = decoded.email || '';
    return {
      uid: decoded.uid,
      email,
      admin: isAdminEmail(email),
      source: 'firebase_id_token',
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(authorization: string | undefined): Promise<ResolvedAuth> {
  const user = await resolveAuth(authorization);
  if (!user) {
    const err = new Error('UNAUTHORIZED') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  if (!user.admin) {
    const err = new Error('FORBIDDEN') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
  return user;
}
