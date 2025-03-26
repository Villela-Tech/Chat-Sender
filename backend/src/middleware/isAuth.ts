import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_NO_TOKEN_PROVIDED", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verify(token, authConfig.secret);
    const { id, profile, companyId } = decoded as TokenPayload;
    
    req.user = {
      id,
      profile,
      companyId
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError("ERR_TOKEN_EXPIRED", 401);
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError("ERR_INVALID_TOKEN", 401);
    }
    throw new AppError("ERR_AUTH_ERROR", 401);
  }
};

export default isAuth;
