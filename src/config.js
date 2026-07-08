// Deployment configuration for phase 3 (accounts + feedback + admin).
// Filled in once the Azure Functions API + Google OAuth client exist.
// Until both are set, the app runs exactly as before: guest-only,
// everything in localStorage, no account UI shown.
const env = import.meta.env || {} // Vite injects this; plain node (tests) doesn't

// e.g. 'https://supercoach-api.azurewebsites.net/api'
export const API_BASE = env.VITE_API_BASE || ''
// e.g. '1234-abc.apps.googleusercontent.com'
export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || ''

export const APP_VERSION = '3.0.0'

export const apiEnabled = () => Boolean(API_BASE)
export const accountsEnabled = () => Boolean(API_BASE && GOOGLE_CLIENT_ID)
