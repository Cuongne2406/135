export function getCookieName() {
  return process.env.TOKEN_COOKIE_NAME || process.env.token || 'token';
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function getAppUrl() {
  return process.env.URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

export function getMongoUri() {
  return process.env.MongoDB_URI || process.env.MONGODB_URI || '';
}

export function getEportfolioUrl() {
  return process.env.NEXT_PUBLIC_EPORTFOLIO_URL || 'http://localhost:3001';
}
