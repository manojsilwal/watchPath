import jwt, { type SignOptions } from 'jsonwebtoken';

const TYP = 'wp_api';
const ISS = 'watchpath-api';

export type SessionPayload = {
  sub: string;
  email: string;
  admin: boolean;
  typ: typeof TYP;
};

export function mintSessionToken(uid: string, email: string, admin: boolean): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set and at least 16 characters');
  }
  const payload: SessionPayload = {
    sub: uid,
    email,
    admin,
    typ: TYP,
  };
  const expiresIn = (process.env.JWT_EXPIRES_IN || '12h') as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
    issuer: ISS,
  });
}

export function verifySessionToken(token: string): SessionPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: ISS,
  });
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  const p = decoded as jwt.JwtPayload & Partial<SessionPayload>;
  if (p.typ !== TYP) {
    throw new Error('Invalid token type');
  }
  if (!p.sub || !p.email || typeof p.admin !== 'boolean') {
    throw new Error('Invalid session claims');
  }
  return {
    sub: p.sub,
    email: p.email,
    admin: p.admin,
    typ: TYP,
  };
}
