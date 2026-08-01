import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import upload from '../../middleware/upload.js';
import mediaValidation from './media.validation.js';
import mediaController from './media.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: List media assets
 *     description: Paginated list of uploaded media. Supports search and type filter. Requires media:watch.
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by file name
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [image, video] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Paginated media list with thumbnails
 *       403:
 *         description: Missing media:watch
 */
router
  .route('/')
  .get(requirePermission('media:watch'), mediaController.getMediaList);

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload one or multiple files
 *     description: "Upload files using multipart/form-data. Key: 'files' (max 10). MIME type is validated against allowlist (images + videos) and actual content — not extension. Thumbnails are auto-generated for images. Requires media:upload."
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: One or more files (max 10 per request)
 *     responses:
 *       201:
 *         description: Files uploaded, thumbnails generated
 *       400:
 *         description: Invalid MIME type or file too large
 *       403:
 *         description: Missing media:upload
 */
router
  .route('/upload')
  .post(requirePermission('media:upload'), upload.array('files', 10), mediaController.uploadFiles);

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get a media asset by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Media asset details
 *       403:
 *         description: Missing media:read
 *       404:
 *         description: Media not found
 *   put:
 *     summary: Update media metadata (alt text, title)
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altText: { type: string }
 *               title: { type: string }
 *     responses:
 *       200:
 *         description: Media updated
 *       403:
 *         description: Missing media:write
 *   delete:
 *     summary: Delete a media asset
 *     description: "Removes the database record AND the stored file. If the asset is still attached to products — either refuse (409) or clean-detach depending on implementation."
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Media deleted (file removed from disk)
 *       403:
 *         description: Missing media:delete
 *       404:
 *         description: Media not found
 *       409:
 *         description: Media still attached to products
 */
router
  .route('/:id')
  .get(requirePermission('media:read'), validate(mediaValidation.getMedia), mediaController.getMedia)
  .put(requirePermission('media:write'), validate(mediaValidation.updateMedia), mediaController.updateMedia)
  .delete(requirePermission('media:delete'), validate(mediaValidation.deleteMedia), mediaController.deleteMedia);

export default router;
