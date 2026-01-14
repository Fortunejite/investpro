import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import config from '@/config';
import { User } from '@/generated/prisma/client';

export type TokenPayload = Omit<User, 'hashed_password'>;

class TokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }

  generateResetToken (): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}
export const tokenService = new TokenService();
