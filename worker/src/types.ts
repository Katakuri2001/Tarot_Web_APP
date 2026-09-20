export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  JWT_ISSUER?: string;
  TOKEN_TTL_SECONDS?: string;
  MAX_IMAGE_BYTES?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "user";
  exp: number;
  iat: number;
  iss: string;
}
