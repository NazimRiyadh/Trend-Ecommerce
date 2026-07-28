import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import userValidation from './user.validation.js';
import userController from './user.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('user:create'),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    requirePermission('user:watch'),
    userController.getUsers
  );

router
  .route('/:id')
  .get(
    requirePermission('user:read'),
    validate(userValidation.getUser),
    userController.getUser
  )
  .put(
    requirePermission('user:update'),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    requirePermission('user:delete'),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

export default router;
