import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import upload from '../../middleware/upload.js';
import mediaValidation from './media.validation.js';
import mediaController from './media.controller.js';

const router = express.Router();

router
  .route('/')
  .get(
    requirePermission('media:watch'),
    mediaController.getMediaList
  );

router
  .route('/upload')
  .post(
    requirePermission('media:upload'),
    upload.array('files', 10), // Limit 10 files per request
    mediaController.uploadFiles
  );

router
  .route('/:id')
  .get(
    requirePermission('media:read'),
    validate(mediaValidation.getMedia),
    mediaController.getMedia
  )
  .put(
    requirePermission('media:write'),
    validate(mediaValidation.updateMedia),
    mediaController.updateMedia
  )
  .delete(
    requirePermission('media:delete'),
    validate(mediaValidation.deleteMedia),
    mediaController.deleteMedia
  );

export default router;
