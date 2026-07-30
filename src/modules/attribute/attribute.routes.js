import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import attributeValidation from './attribute.validation.js';
import attributeController from './attribute.controller.js';

const router = express.Router();

router
  .route('/')
  .post(
    requirePermission('attribute:create'),
    validate(attributeValidation.createAttribute),
    attributeController.createAttribute
  )
  .get(
    requirePermission('attribute:watch'),
    attributeController.getAttributes
  );

router
  .route('/:id')
  .get(
    requirePermission('attribute:read'),
    validate(attributeValidation.getAttribute),
    attributeController.getAttribute
  )
  .put(
    requirePermission('attribute:update'),
    validate(attributeValidation.updateAttribute),
    attributeController.updateAttribute
  )
  .delete(
    requirePermission('attribute:delete'),
    validate(attributeValidation.deleteAttribute),
    attributeController.deleteAttribute
  );

export default router;
