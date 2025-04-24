import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { profile } = req.user;

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  return next();
};

export default isAdmin; 