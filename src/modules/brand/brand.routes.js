import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import brandValidation from './brand.validation.js';
import brandController from './brand.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Create a brand
 *     description: Creates a new brand with an auto-generated slug. Optionally attach a logo from the media library. Requires brand:create.
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nike
 *               description:
 *                 type: string
 *               logoId:
 *                 type: string
 *                 format: uuid
 *                 description: Media ID for brand logo
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Brand created
 *       403:
 *         description: Missing brand:create
 *       409:
 *         description: Brand name or slug already exists
 *   get:
 *     summary: List all brands
 *     description: Paginated list of brands. Supports search. Requires brand:watch.
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated brand list
 *       403:
 *         description: Missing brand:watch
 */
router
  .route('/')
  .post(
    requirePermission('brand:create'),
    validate(brandValidation.createBrand),
    brandController.createBrand
  )
  .get(
    requirePermission('brand:watch'),
    validate(brandValidation.listBrands),
    brandController.getBrands
  );

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Get a brand by ID
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand details
 *       403:
 *         description: Missing brand:read
 *       404:
 *         description: Brand not found
 *   put:
 *     summary: Update a brand
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
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
 *               name: { type: string }
 *               description: { type: string }
 *               logoId: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Brand updated
 *       403:
 *         description: Missing brand:update
 *       404:
 *         description: Brand not found
 *   delete:
 *     summary: Delete a brand
 *     description: Refused (409) if any products are still associated with the brand.
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand deleted
 *       403:
 *         description: Missing brand:delete
 *       404:
 *         description: Brand not found
 *       409:
 *         description: Brand is still in use by one or more products
 */
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
