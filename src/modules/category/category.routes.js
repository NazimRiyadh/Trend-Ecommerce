import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import categoryValidation from './category.validation.js';
import categoryController from './category.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('category:create'),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  )
  .get(
    requirePermission('category:watch'),
    categoryController.getCategoryTree
  );

router
  .route('/:id')
  .get(
    requirePermission('category:read'),
    validate(categoryValidation.getCategory),
    categoryController.getCategory
  )
  .put(
    requirePermission('category:update'),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    requirePermission('category:delete'),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

export default router;
