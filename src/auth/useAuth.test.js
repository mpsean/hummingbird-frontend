import { describe, it, expect, beforeEach } from 'vitest'
import {
  getToken,
  storeToken,
  clearToken,
  validateToken,
  getSubdomain,
} from './useAuth'

// Build a minimal signed-looking JWT from a plain payload object.
// The signature segment is a stub — validateToken never verifies it.
function makeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.stub-signature`
}

// jsdom sets window.location.hostname to 'localhost' by default.
// getSubdomain() returns the first label of the hostname.
const JSDOM_SUBDOMAIN = 'localhost'

// ── Token storage ─────────────────────────────────────────────────────────────

describe('token storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    storeToken('my-token')
    expect(getToken()).toBe('my-token')
  })

  it('clears a stored token', () => {
    storeToken('my-token')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('overwrites an existing token', () => {
    storeToken('first')
    storeToken('second')
    expect(getToken()).toBe('second')
  })
})

// ── getSubdomain ──────────────────────────────────────────────────────────────

describe('getSubdomain', () => {
  it('returns the first label of the hostname', () => {
    // jsdom hostname is 'localhost'
    expect(getSubdomain()).toBe(JSDOM_SUBDOMAIN)
  })
})

// ── validateToken ─────────────────────────────────────────────────────────────

describe('validateToken', () => {
  beforeEach(() => localStorage.clear())

  it('returns false for null', () => {
    expect(validateToken(null)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(validateToken('')).toBe(false)
  })

  it('returns false for a token with no dots (non-JWT)', () => {
    // split('.')[1] is undefined → atob(undefined) throws → parseJwt returns null
    expect(validateToken('notajwt')).toBe(false)
  })

  it('returns false for an expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 60 // 60 s in the past
    const token = makeJwt({ exp, tenant_slug: JSDOM_SUBDOMAIN })
    expect(validateToken(token)).toBe(false)
  })

  it('returns false when tenant_slug does not match the current subdomain', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeJwt({ exp, tenant_slug: 'other-tenant' })
    expect(validateToken(token)).toBe(false)
  })

  it('returns true for a valid, non-expired token matching the subdomain', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeJwt({ exp, tenant_slug: JSDOM_SUBDOMAIN })
    expect(validateToken(token)).toBe(true)
  })

  it('returns true when exp is absent (no expiry set)', () => {
    // The guard is `if (payload.exp && ...)` — missing exp is treated as valid
    const token = makeJwt({ tenant_slug: JSDOM_SUBDOMAIN })
    expect(validateToken(token)).toBe(true)
  })
})
