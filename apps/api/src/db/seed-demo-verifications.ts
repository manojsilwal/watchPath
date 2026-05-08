/**
 * Inserts demo verification rows if the table is empty (safe to run multiple times).
 * Run: npm run db:seed -w apps/api
 */
import '../load-env';

import { closePool, getPool } from './pool';
import * as verificationRepo from './verificationRepo';

const demos = [
  {
    titleId: 'tmdb_movie_693134',
    candidateUrl: 'https://youtube.com/watch?v=fake123',
    sourceDomain: 'youtube.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'trailer',
    confidence: 0.92,
    safeToShowUser: false,
    reasons: [
      'Video runtime (3 min) is much shorter than expected movie runtime (166 min)',
      'Video title contains "official trailer" keyword',
      'Uploader is official studio channel (verified)',
    ],
  },
  {
    titleId: 'tmdb_movie_519182',
    candidateUrl: 'https://youtube.com/watch?v=fake456',
    sourceDomain: 'youtube.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'fake_or_misleading',
    confidence: 0.88,
    safeToShowUser: false,
    reasons: [
      'Uploader channel is not official or verified',
      'Video title contains "full movie HD" but runtime is only 8 minutes',
      'Thumbnail quality suggests screen recording or cam quality',
      'High likelihood of being a compilation or recap video',
    ],
  },
  {
    titleId: 'tmdb_movie_573435',
    candidateUrl: 'https://suspicious-site.com/bad-boys-free',
    sourceDomain: 'suspicious-site.com',
    isLikelyRealMovie: false,
    isLikelyLegal: false,
    classification: 'piracy_risk',
    confidence: 0.95,
    safeToShowUser: false,
    reasons: [
      'Domain is not in legal provider allowlist',
      'Domain has no known licensing agreements',
      'Site structure matches common piracy site patterns',
      'Multiple ad redirects detected',
    ],
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = getPool();
  const { rows } = await pool.query<{ n: string }>('SELECT COUNT(*)::text AS n FROM verification_queue');
  const count = parseInt(rows[0]?.n || '0', 10);
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[seed] verification_queue already has ${count} row(s); skipping`);
    await closePool();
    return;
  }
  for (const row of demos) {
    await verificationRepo.insertPending(pool, row);
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] inserted ${demos.length} demo rows`);
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
