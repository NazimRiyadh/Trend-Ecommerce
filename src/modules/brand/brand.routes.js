import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import brandValidation from './brand.validation.js';
import brandController from './brand.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('brand:create'),
    validate(brandValidation.createBrand),
    brandController.createBrand
  )
  .get(
    requirePermission('brand:watch'),
    brandController.getBrands
  );

router
  .route('/:id')
  .get(
    requirePermission('brand:read'),
    validate(brandValidation.getBrand),
    brandController.getBrand
  )
  .put(
    requirePermission('brand:update'),
    validate(brandValidation.updateBrand),
    brandController.updateBrand
  )
  .delete(
    requirePermission('brand:delete'),
    validate(brandValidation.deleteBrand),
    brandController.deleteBrand
  );

export default router;
