import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import productValidation from './product.validation.js';
import productController from './product.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     description: |
 *       Creates a new product atomically in a single transaction.
 *       - **Simple product** (`hasVariants: false`): must include `price` and `stock`.
 *       - **Variable product** (`hasVariants: true`): must include at least one `variants` entry; product-level price/stock are ignored.
 *       All media, categories, brand, and attribute values are validated within the same transaction.
 *       Requires product:create.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku, hasVariants]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Classic T-Shirt"
 *               sku:
 *                 type: string
 *                 example: "TS-001"
 *               hasVariants:
 *                 type: boolean
 *                 example: false
 *               price:
 *                 type: number
 *                 example: 29.99
 *               salePrice:
 *                 type: number
 *                 example: 24.99
 *               stock:
 *                 type: integer
 *                 example: 100
 *               description:
 *                 type: string
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     mediaId: { type: string, format: uuid }
 *                     isThumbnail: { type: boolean }
 *                     isGallery: { type: boolean }
 *                     sortOrder: { type: integer }
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [sku, price, stock, attributes]
 *                   properties:
 *                     sku: { type: string }
 *                     price: { type: number }
 *                     salePrice: { type: number }
 *                     stock: { type: integer }
 *                     attributes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           attributeValueId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error or duplicate variant combination
 *       403:
 *         description: Missing product:create
 *       404:
 *         description: Brand, category, media, or attribute value not found
 *       409:
 *         description: SKU conflict
 *   get:
 *     summary: List products
 *     description: Paginated, filterable, sortable product list. Requires product:watch.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or SKU
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: brandId
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, name, price], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated product list with thumbnail and price range
 *       403:
 *         description: Missing product:watch
 */
router
  .route('/')
  .post(
    requirePermission('product:create'),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(
    requirePermission('product:watch'),
    validate(productValidation.listProducts),
    productController.getProducts
  );

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     description: Returns the full product with categories, brand, all media, variants and their attribute values. Requires product:read.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full product details
 *       403:
 *         description: Missing product:read
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update a product
 *     description: Updates product fields. Does not update variants or media — use sub-routes for those.
 *     tags: [Product]
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
 *               price: { type: number }
 *               salePrice: { type: number }
 *               stock: { type: integer }
 *               brandId: { type: string }
 *               categoryIds:
 *                 type: array
 *                 items: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product
 *     description: Hard deletes the product and cascades to variants, category links, and media joins. The media assets themselves are not deleted.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 *       403:
 *         description: Missing product:delete
 *       404:
 *         description: Product not found
 */
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

/**
 * @swagger
 * /api/products/{id}/variants:
 *   post:
 *     summary: Add variants to a variable product
 *     description: Appends one or more variants to an existing variable product. Each variant must have a unique attribute combination. Requires product:update.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [variants]
 *             properties:
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [sku, price, stock, attributes]
 *                   properties:
 *                     sku: { type: string }
 *                     price: { type: number }
 *                     stock: { type: integer }
 *                     attributes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           attributeValueId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Variants added
 *       400:
 *         description: Duplicate variant combination or product is not variable
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Product or attribute value not found
 *       409:
 *         description: SKU conflict
 */
router
  .route('/:id/variants')
  .post(
    requirePermission('product:update'),
    validate(productValidation.addVariants),
    productController.addVariants
  );

/**
 * @swagger
 * /api/products/{id}/variants/{variantId}:
 *   put:
 *     summary: Update a product variant
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price: { type: number }
 *               salePrice: { type: number }
 *               stock: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Variant updated
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Variant not found
 *   delete:
 *     summary: Delete a product variant
 *     description: Refuses deletion if it is the last variant on a variable product.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Variant deleted
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Variant not found
 *       409:
 *         description: Cannot delete the last variant
 */
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

/**
 * @swagger
 * /api/products/{id}/media:
 *   post:
 *     summary: Attach media to a product
 *     description: Links one or more media assets from the media library to a product. Requires product:update.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [media]
 *             properties:
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [mediaId]
 *                   properties:
 *                     mediaId: { type: string, format: uuid }
 *                     isThumbnail: { type: boolean }
 *                     isGallery: { type: boolean }
 *                     sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Media attached
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Product or media not found
 */
router
  .route('/:id/media')
  .post(
    requirePermission('product:update'),
    validate(productValidation.addMedia),
    productController.addMedia
  );

/**
 * @swagger
 * /api/products/{id}/media/{mediaId}:
 *   put:
 *     summary: Update a product media attachment
 *     description: Updates metadata on a product–media join (isThumbnail, isGallery, sortOrder).
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isThumbnail: { type: boolean }
 *               isGallery: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Media attachment updated
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Media attachment not found
 *   delete:
 *     summary: Remove media from a product
 *     description: Unlinks a media asset from the product (does not delete the media asset itself).
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Media removed from product
 *       403:
 *         description: Missing product:update
 *       404:
 *         description: Media attachment not found
 */
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
