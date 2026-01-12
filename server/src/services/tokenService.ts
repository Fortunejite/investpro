import jwt from 'jsonwebtoken';
import config from '@/config';

export interface TokenPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

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
}
export const tokenService = new TokenService();
