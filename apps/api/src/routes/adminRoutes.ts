import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAdmin } from '../auth/resolve-auth';
import { getPool } from '../db/pool';
import * as verificationRepo from '../db/verificationRepo';

const statusQuery = z.enum(['pending', 'approved', 'rejected']);
const listQuery = z.object({
  status: statusQuery.default('pending'),
  limit: z.coerce.number().min(1).max(200).default(100),
});

const uuidParam = z.string().uuid();

const ingestBody = z.object({
  titleId: z.string().min(1),
  candidateUrl: z.string().url(),
  sourceDomain: z.string().min(1),
  isLikelyRealMovie: z.boolean(),
  isLikelyLegal: z.boolean(),
  classification: z.string().min(1),
  confidence: z.number().min(0).max(1),
  safeToShowUser: z.boolean(),
  reasons: z.array(z.string()),
});

function safeEqualKey(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function verificationToApi(row: verificationRepo.VerificationRow) {
  return {
    id: row.id,
    titleId: row.titleId,
    candidateUrl: row.candidateUrl,
    sourceDomain: row.sourceDomain,
    isLikelyRealMovie: row.isLikelyRealMovie,
    isLikelyLegal: row.isLikelyLegal,
    classification: row.classification,
    confidence: row.confidence,
    safeToShowUser: row.safeToShowUser,
    reasons: row.reasons,
    createdAt: row.createdAt,
    status: row.status,
    reviewedAt: row.reviewedAt,
    reviewedByUid: row.reviewedByUid,
    reviewerEmail: row.reviewerEmail,
  };
}

export function registerAdminRoutes(app: FastifyInstance): void {
  app.get('/api/admin/verifications', async (request, reply) => {
    if (!process.env.DATABASE_URL) {
      return reply.status(503).send({ error: 'DATABASE_URL is not configured' });
    }
    try {
      await requireAdmin(request.headers.authorization);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.status(err.statusCode || 403).send({ error: err.message || 'Forbidden' });
    }

    const parsed = listQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query', details: parsed.error.flatten() });
    }
    const { status, limit } = parsed.data;

    try {
      const pool = getPool();
      const rows = await verificationRepo.listByStatus(pool, status, limit);
      return reply.send({ items: rows.map(verificationToApi) });
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Database error' });
    }
  });

  app.post('/api/admin/verifications/:id/approve', async (request, reply) => {
    if (!process.env.DATABASE_URL) {
      return reply.status(503).send({ error: 'DATABASE_URL is not configured' });
    }
    let auth;
    try {
      auth = await requireAdmin(request.headers.authorization);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.status(err.statusCode || 403).send({ error: err.message || 'Forbidden' });
    }

    const idParse = uuidParam.safeParse((request.params as { id: string }).id);
    if (!idParse.success) {
      return reply.status(400).send({ error: 'Invalid id' });
    }

    try {
      const pool = getPool();
      const updated = await verificationRepo.updateStatus(
        pool,
        idParse.data,
        'approved',
        auth.uid,
        auth.email,
      );
      if (!updated) {
        return reply.status(404).send({ error: 'Pending item not found' });
      }
      return reply.send({ item: verificationToApi(updated) });
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Database error' });
    }
  });

  app.post('/api/admin/verifications/:id/reject', async (request, reply) => {
    if (!process.env.DATABASE_URL) {
      return reply.status(503).send({ error: 'DATABASE_URL is not configured' });
    }
    let auth;
    try {
      auth = await requireAdmin(request.headers.authorization);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.status(err.statusCode || 403).send({ error: err.message || 'Forbidden' });
    }

    const idParse = uuidParam.safeParse((request.params as { id: string }).id);
    if (!idParse.success) {
      return reply.status(400).send({ error: 'Invalid id' });
    }

    try {
      const pool = getPool();
      const updated = await verificationRepo.updateStatus(
        pool,
        idParse.data,
        'rejected',
        auth.uid,
        auth.email,
      );
      if (!updated) {
        return reply.status(404).send({ error: 'Pending item not found' });
      }
      return reply.send({ item: verificationToApi(updated) });
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Database error' });
    }
  });

  /** Worker / pipeline: create pending rows. Protected by INGEST_API_KEY. */
  app.post('/api/internal/verifications', async (request, reply) => {
    const key = process.env.INGEST_API_KEY;
    if (!key) {
      return reply.status(503).send({ error: 'INGEST_API_KEY is not configured' });
    }
    const provided = String(request.headers['x-ingest-key'] || '');
    if (!safeEqualKey(provided, key)) {
      return reply.status(401).send({ error: 'Invalid X-Ingest-Key' });
    }
    if (!process.env.DATABASE_URL) {
      return reply.status(503).send({ error: 'DATABASE_URL is not configured' });
    }

    const body = ingestBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    try {
      const pool = getPool();
      const row = await verificationRepo.insertPending(pool, body.data);
      return reply.status(201).send({ item: verificationToApi(row) });
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Database error' });
    }
  });
}
