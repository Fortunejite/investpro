import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '@/config';
import { User } from '@prisma/client';

export type TokenPayload = Omit<User, 'hashed_password' | 'refreshToken'>;
interface RefreshTokenPayload {
  userId: number;
  rememberMe: boolean;
}

class TokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '10m' });
  }

  generateRefreshToken(userId: number, rememberMe = false): string {
    return jwt.sign({ userId, rememberMe }, config.refreshToken, {
      expiresIn: rememberMe ? '30d' : '7d',
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, config.refreshToken) as RefreshTokenPayload;
    } catch {
      return null;
    }
  }

  generateResetToken(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}
export const tokenService = new TokenService();
