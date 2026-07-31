import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import productValidation from './product.validation.js';
import productController from './product.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('product:create'),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(
    requirePermission('product:watch'),
    productController.getProducts
  );

router
  .route('/:id')
  .get(
    requirePermission('product:read'),
    validate(productValidation.getProduct),
    productController.getProduct
  )
  .put(
    requirePermission('product:update'),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(
    requirePermission('product:delete'),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

// Variants
router
  .route('/:id/variants')
  .post(
    requirePermission('product:update'),
    validate(productValidation.addVariants),
    productController.addVariants
  );

router
  .route('/:id/variants/:variantId')
  .put(
    requirePermission('product:update'),
    validate(productValidation.updateVariant),
    productController.updateVariant
  )
  .delete(
    requirePermission('product:update'),
    validate(productValidation.deleteVariant),
    productController.deleteVariant
  );

// Media
router
  .route('/:id/media')
  .post(
    requirePermission('product:update'),
    validate(productValidation.addMedia),
    productController.addMedia
  );

router
  .route('/:id/media/:mediaId')
  .put(
    requirePermission('product:update'),
    validate(productValidation.updateMediaAttachment),
    productController.updateMediaAttachment
  )
  .delete(
    requirePermission('product:update'),
    validate(productValidation.deleteMediaAttachment),
    productController.deleteMediaAttachment
  );

export default router;
