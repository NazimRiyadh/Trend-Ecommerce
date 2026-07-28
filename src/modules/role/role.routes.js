import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import roleValidation from './role.validation.js';
import roleController from './role.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('role:create'),
    validate(roleValidation.createRole),
    roleController.createRole
  )
  .get(
    requirePermission('role:watch'),
    roleController.getRoles
  );

router
  .route('/:id')
  .get(
    requirePermission('role:read'),
    validate(roleValidation.getRole),
    roleController.getRole
  )
  .put(
    requirePermission('role:update'),
    validate(roleValidation.updateRole),
    roleController.updateRole
  )
  .delete(
    requirePermission('role:delete'),
    validate(roleValidation.deleteRole),
    roleController.deleteRole
  );

export default router;
