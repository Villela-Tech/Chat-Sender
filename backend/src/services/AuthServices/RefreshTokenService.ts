import { verify } from "jsonwebtoken";
import { Response as Res } from "express";

import User from "../../models/User";
import AppError from "../../errors/AppError";
import ShowUserService from "../UserServices/ShowUserService";
import authConfig from "../../config/auth";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";

interface RefreshTokenPayload {
  id: string;
  tokenVersion: number;
  companyId: number;
  iat: number;
  exp: number;
}

interface Response {
  user: User;
  newToken: string;
  refreshToken: string;
}

export const RefreshTokenService = async (
  res: Res,
  token: string
): Promise<Response> => {
  if (!token) {
    throw new AppError("ERR_NO_REFRESH_TOKEN", 401);
  }

  try {
    const decoded = verify(token, authConfig.refreshSecret) as RefreshTokenPayload;
    
    if (!decoded) {
      res.clearCookie("jrt");
      throw new AppError("ERR_INVALID_REFRESH_TOKEN", 401);
    }

    const { id, tokenVersion, companyId } = decoded;
    const user = await ShowUserService(id);

    if (!user) {
      res.clearCookie("jrt");
      throw new AppError("ERR_USER_NOT_FOUND", 401);
    }

    if (user.tokenVersion !== tokenVersion) {
      res.clearCookie("jrt");
      throw new AppError("ERR_TOKEN_VERSION_INVALID", 401);
    }

    const newToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return { user, newToken, refreshToken };
  } catch (err) {
    res.clearCookie("jrt");
    if (err instanceof AppError) {
      throw err;
    }
    if (err.name === 'TokenExpiredError') {
      throw new AppError("ERR_REFRESH_TOKEN_EXPIRED", 401);
    }
    throw new AppError("ERR_REFRESH_TOKEN_INVALID", 401);
  }
};
