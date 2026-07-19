// Firebase ID-token verification for protected API routes.
//
// When Firebase is configured (GOOGLE_APPLICATION_CREDENTIALS set), admin and
// volunteer routes require a valid `Authorization: Bearer <idToken>` header and
// a matching role in the `users/{uid}` Firestore document.
// In pure in-memory demo mode (no Firebase), routes stay open so the project
// still runs with zero configuration.

import type { Request, Response, NextFunction } from 'express';
import type { AppRole } from '@stadiummind/shared';
import { auth, db } from './firebase';

const USE_FIREBASE = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

export interface AuthedRequest extends Request {
  user?: { uid: string; email?: string; role: AppRole };
}

// Small cache so we don't hit Firestore for the role on every request.
const roleCache = new Map<string, { role: AppRole; expires: number }>();
const ROLE_TTL = 5 * 60 * 1000;

async function getRole(uid: string): Promise<AppRole> {
  const cached = roleCache.get(uid);
  if (cached && cached.expires > Date.now()) return cached.role;
  const doc = await db.collection('users').doc(uid).get();
  const role = (doc.exists && (doc.data()?.role as AppRole)) || 'fan';
  roleCache.set(uid, { role, expires: Date.now() + ROLE_TTL });
  return role;
}

export function requireRole(...roles: AppRole[]) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!USE_FIREBASE) return next(); // zero-config demo mode: no auth infra

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Sign in and retry.' });
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      const role = await getRole(decoded.uid);
      if (!roles.includes(role)) {
        return res.status(403).json({ error: `This action requires role: ${roles.join(' or ')}.` });
      }
      req.user = { uid: decoded.uid, email: decoded.email, role };
      next();
    } catch (err) {
      console.warn('[auth] token verification failed:', (err as Error).message);
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
  };
}

export const requireAdmin = requireRole('admin');
export const requireStaff = requireRole('admin', 'volunteer');
