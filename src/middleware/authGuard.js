import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import config from '../config/index.js';
import prisma from '../config/prisma.js';

const publicPaths = [
  '/health',
  '/api/auth/login',
  '/api/auth/refresh'
];

const authGuard = async (req, res, next) => {
  try {
    // Check if route is marked as public
    if (req.skipAuth || publicPaths.includes(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication token missing');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }

    // Fetch user and check if active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is inactive');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authGuard;
