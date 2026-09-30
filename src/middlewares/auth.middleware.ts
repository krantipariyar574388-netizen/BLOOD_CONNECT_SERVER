import { Request, Response, NextFunction } from "express";
import { UserRole } from "../@types/enum.types";
import { AppError } from "../utils/customError.util";
import { verifyToken } from "../utils/jwt.util";
import { User } from "../models/user.model";

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        role: UserRole;
    };
}

export const authentication = (roles?: UserRole[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cookies = req.cookies;
            const access_token = cookies?.["access_token"];

            if (!access_token) {
                throw new AppError("Unauthorized. Access denied!!", 401);
            }

            const decoded_data = verifyToken(access_token);

            if (!decoded_data) {
                throw new AppError("Unauthorized. Invalid or expired token!!", 401);
            }

            if (roles && !roles.includes(decoded_data.role)) {
                throw new AppError("Forbidden. You cannot access this resource!!", 403);
            }

            const user = await User.findById(decoded_data._id).select("isBanned");
            if (!user) {
                throw new AppError("Unauthorized. User not found!!", 401);
            }
            if (user.isBanned) {
                throw new AppError("Your account has been suspended. Please contact support.", 403);
            }

            req.user = {
                _id: decoded_data._id as string,
                email: decoded_data.email,
                role: decoded_data.role,
            };
            next();
        } catch (error) {
            next(error);
        }
    };
};