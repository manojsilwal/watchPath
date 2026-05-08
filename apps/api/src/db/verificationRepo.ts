import type { Pool } from 'pg';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type VerificationRow = {
  id: string;
  titleId: string;
  candidateUrl: string;
  sourceDomain: string;
  isLikelyRealMovie: boolean;
  isLikelyLegal: boolean;
  classification: string;
  confidence: number;
  safeToShowUser: boolean;
  reasons: string[];
  status: VerificationStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUid: string | null;
  reviewerEmail: string | null;
};

function mapRow(r: Record<string, unknown>): VerificationRow {
  return {
    id: String(r.id),
    titleId: String(r.title_id),
    candidateUrl: String(r.candidate_url),
    sourceDomain: String(r.source_domain),
    isLikelyRealMovie: Boolean(r.is_likely_real_movie),
    isLikelyLegal: Boolean(r.is_likely_legal),
    classification: String(r.classification),
    confidence: Number(r.confidence),
    safeToShowUser: Boolean(r.safe_to_show_user),
    reasons: Array.isArray(r.reasons) ? (r.reasons as string[]) : JSON.parse(JSON.stringify(r.reasons)),
    status: r.status as VerificationStatus,
    createdAt: new Date(r.created_at as string).toISOString(),
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at as string).toISOString() : null,
    reviewedByUid: r.reviewed_by_uid ? String(r.reviewed_by_uid) : null,
    reviewerEmail: r.reviewer_email ? String(r.reviewer_email) : null,
  };
}

export async function listByStatus(
  pool: Pool,
  status: VerificationStatus,
  limit: number,
): Promise<VerificationRow[]> {
  const res = await pool.query(
    `SELECT * FROM verification_queue
     WHERE status = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [status, limit],
  );
  return res.rows.map(mapRow);
}

export async function updateStatus(
  pool: Pool,
  id: string,
  status: 'approved' | 'rejected',
  reviewedByUid: string,
  reviewerEmail: string,
): Promise<VerificationRow | null> {
  const res = await pool.query(
    `UPDATE verification_queue
     SET status = $2,
         reviewed_at = now(),
         reviewed_by_uid = $3,
         reviewer_email = $4
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id, status, reviewedByUid, reviewerEmail],
  );
  if (res.rowCount === 0) return null;
  return mapRow(res.rows[0]);
}

export async function insertPending(
  pool: Pool,
  input: Omit<
    VerificationRow,
    'id' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewedByUid' | 'reviewerEmail'
  >,
): Promise<VerificationRow> {
  const res = await pool.query(
    `INSERT INTO verification_queue (
       title_id, candidate_url, source_domain,
       is_likely_real_movie, is_likely_legal, classification,
       confidence, safe_to_show_user, reasons
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
     RETURNING *`,
    [
      input.titleId,
      input.candidateUrl,
      input.sourceDomain,
      input.isLikelyRealMovie,
      input.isLikelyLegal,
      input.classification,
      input.confidence,
      input.safeToShowUser,
      JSON.stringify(input.reasons),
    ],
  );
  return mapRow(res.rows[0]);
}
