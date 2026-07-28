import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import permissionValidation from './permission.validation.js';
import permissionController from './permission.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('permission:create'),
    validate(permissionValidation.createPermissionGroup),
    permissionController.createPermissionGroup
  )
  .get(
    requirePermission('permission:watch'),
    permissionController.getPermissionGroups
  );

router
  .route('/:id')
  .get(
    requirePermission('permission:read'),
    validate(permissionValidation.getPermissionGroup),
    permissionController.getPermissionGroup
  )
  .put(
    requirePermission('permission:update'),
    validate(permissionValidation.updatePermissionGroup),
    permissionController.updatePermissionGroup
  )
  .delete(
    requirePermission('permission:delete'),
    validate(permissionValidation.deletePermissionGroup),
    permissionController.deletePermissionGroup
  );

export default router;
