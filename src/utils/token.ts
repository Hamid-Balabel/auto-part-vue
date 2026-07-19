const tokenKey = 'auto_part_admin_token'

export function getStoredToken(): string | null {
  return window.localStorage.getItem(tokenKey)
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(tokenKey, token)
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(tokenKey)
}
