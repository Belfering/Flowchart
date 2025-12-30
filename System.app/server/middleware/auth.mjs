// server/middleware/auth.mjs
// JWT Authentication middleware

import jwt from 'jsonwebtoken'
import { sqlite } from '../db/index.mjs'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production'

/**
 * Verify JWT token and attach user to request
 * Returns 401 if no token or invalid token
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    // Fetch fresh user data from database
    const user = sqlite.prepare(`
      SELECT id, username, email, role, tier, status, email_verified
      FROM users
      WHERE id = ?
    `).get(payload.sub)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' })
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tier: user.tier,
      emailVerified: user.email_verified
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Require admin role
 * Must be used after authenticate middleware
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

/**
 * Require super admin (the original admin from ADMIN_EMAIL env)
 * Only super admin can manage other admins
 * Must be used after authenticate middleware
 */
export function requireSuperAdmin(req, res, next) {
  const superAdminEmail = process.env.ADMIN_EMAIL
  if (!superAdminEmail) {
    return res.status(500).json({ error: 'Super admin not configured' })
  }
  if (req.user?.email !== superAdminEmail) {
    return res.status(403).json({ error: 'Super admin access required' })
  }
  next()
}

/**
 * Check if the current user is the super admin
 */
export function isSuperAdmin(user) {
  const superAdminEmail = process.env.ADMIN_EMAIL
  return superAdminEmail && user?.email === superAdminEmail
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 * Use for routes that work for both authenticated and anonymous users
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)

    const user = sqlite.prepare(`
      SELECT id, username, email, role, tier, status
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(payload.sub)

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tier: user.tier
      }
    }
  } catch {
    // Ignore auth errors for optional routes - continue without user
  }

  next()
}

/**
 * Rate limiting helper for expensive operations
 * Returns tier-based limits
 */
export function getTierLimits(tier) {
  const limits = {
    free: {
      backtestsPerHour: 10,
      apiCallsPerMinute: 100,
      maxBots: 10
    },
    pro: {
      backtestsPerHour: 50,
      apiCallsPerMinute: 500,
      maxBots: 50
    },
    premium: {
      backtestsPerHour: 100,
      apiCallsPerMinute: 1000,
      maxBots: -1 // unlimited
    }
  }

  return limits[tier] || limits.free
}

export { JWT_SECRET }
