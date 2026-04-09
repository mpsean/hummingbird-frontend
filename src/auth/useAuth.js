const SIGNIN_URL = import.meta.env.VITE_SIGNIN_URL || 'http://signin.hmmbird.xyz'
const TOKEN_KEY = 'hb_token'

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) }
  catch { return null }
}

export function getSubdomain() {
  return window.location.hostname.split('.')[0]
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Returns true if token exists, is not expired, and belongs to this tenant
export function validateToken(token) {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload) return false
  if (payload.exp && Date.now() / 1000 > payload.exp) return false
  return payload.tenant_slug === getSubdomain()
}

export function redirectToSignin() {
  window.location.href =
    `${SIGNIN_URL}?redirect=${encodeURIComponent(window.location.origin)}`
}
