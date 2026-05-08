import type { FastifyInstance } from 'fastify';

import { isAdminEmail } from '../auth/admin-allowlist';
import { getFirebaseAdmin } from '../auth/firebase-admin';
import { mintSessionToken } from '../auth/session-jwt';
import { resolveAuth } from '../auth/resolve-auth';

export function registerAuthRoutes(app: FastifyInstance): void {
  app.get('/api/auth/me', async (request, reply) => {
    const user = await resolveAuth(request.headers.authorization);
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return reply.send({
      uid: user.uid,
      email: user.email,
      admin: user.admin,
      source: user.source,
    });
  });

  /**
   * Exchange a Firebase ID token for a WatchPath HS256 session JWT (for admin API calls).
   * Only emails listed in ADMIN_EMAILS receive admin: true in the session token.
   */
  app.post('/api/auth/exchange', async (request, reply) => {
    const raw = request.headers.authorization;
    const token = raw?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) {
      return reply.status(401).send({ error: 'Missing Authorization: Bearer <Firebase ID token>' });
    }

    let uid: string;
    let email: string;
    try {
      const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || '';
    } catch (e) {
      request.log.warn({ err: e }, 'Firebase ID token verification failed');
      return reply.status(401).send({
        error:
          'Invalid or expired Firebase ID token (or Firebase Admin is not configured — set FIREBASE_SERVICE_ACCOUNT_JSON or ADC)',
      });
    }

    if (!email) {
      return reply.status(403).send({ error: 'Signed-in account has no email; cannot authorize admin' });
    }

    const admin = isAdminEmail(email);
    if (!admin) {
      return reply.status(403).send({
        error: 'Not in ADMIN_EMAILS allowlist — session token is only issued for admins',
      });
    }

    try {
      const accessToken = mintSessionToken(uid, email, true);
      return reply.send({
        accessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '12h',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cannot mint session';
      return reply.status(500).send({ error: msg });
    }
  });
}
