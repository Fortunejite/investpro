import { TokenPayload } from "@/services/tokenService";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}