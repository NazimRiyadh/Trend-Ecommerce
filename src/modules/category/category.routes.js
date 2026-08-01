import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import categoryValidation from './category.validation.js';
import categoryController from './category.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a category
 *     description: Creates a new category. Optionally set a parent to nest the category in a tree. Requires category:create.
 *     tags: [Category]
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
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: All electronic goods
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID (omit for root)
 *               imageId:
 *                 type: string
 *                 format: uuid
 *                 description: Media ID for category image
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Missing category:create
 *       404:
 *         description: Parent category or media not found
 *       409:
 *         description: Slug already exists
 *   get:
 *     summary: Get full category tree
 *     description: Returns all categories as a nested tree structure. Requires category:watch.
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nested category tree
 *       403:
 *         description: Missing category:watch
 */
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

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category details
 *       403:
 *         description: Missing category:read
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update a category
 *     tags: [Category]
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
 *               parentId: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         description: Missing category:update
 *       404:
 *         description: Category not found
 *       409:
 *         description: Circular reference detected
 *   delete:
 *     summary: Delete a category
 *     description: Refused if the category has children or is attached to products.
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 *       403:
 *         description: Missing category:delete
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category has children or products
 */
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
