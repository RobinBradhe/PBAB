export const API = 'http://localhost:3000/api'

export function authFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
}
