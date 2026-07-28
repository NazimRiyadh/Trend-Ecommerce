import ApiError from '../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role || !req.user.role.permissions) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied: No permissions found');
      }

      const hasPermission = req.user.role.permissions.some(
        (rp) => rp.permission.name === requiredPermission
      );

      if (!hasPermission) {
        throw new ApiError(StatusCodes.FORBIDDEN, `Access denied: Requires '${requiredPermission}' permission`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requirePermission;
