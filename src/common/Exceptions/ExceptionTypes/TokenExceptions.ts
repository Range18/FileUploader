export enum TokenExceptions {
  InvalidToken = 'Invalid Token',
  TokenNotFound = 'Token not found',
  TokenExpired = 'Token TTL exceeded',
  InvalidAccessToken = 'Invalid Access token',
  AccessTokenExpired = 'Access token has been expired',
  TokenUsesExceeded = 'Token uses exceeded',
  MissingTokenRequired = 'Request require token to be included',
}
