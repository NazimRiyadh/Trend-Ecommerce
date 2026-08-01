import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import attributeValidation from './attribute.validation.js';
import attributeController from './attribute.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/attributes:
 *   post:
 *     summary: Create an attribute
 *     description: Creates a new product attribute (e.g. Color, Size) with a type (text, color, size, material). Requires attribute:create.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Color
 *               type:
 *                 type: string
 *                 enum: [text, color, size, material]
 *                 example: color
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attribute created
 *       403:
 *         description: Missing attribute:create
 *       409:
 *         description: Attribute name already exists
 *   get:
 *     summary: List all attributes
 *     description: Returns all attributes with their associated values. Requires attribute:watch.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of attributes with values
 *       403:
 *         description: Missing attribute:watch
 */
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

/**
 * @swagger
 * /api/attributes/{id}/values:
 *   post:
 *     summary: Add a value to an attribute
 *     description: Appends a new value (e.g. "Red", "#FF0000") to an existing attribute. Requires attribute:create.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Attribute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: Red
 *               displayValue:
 *                 type: string
 *                 example: "#FF0000"
 *     responses:
 *       201:
 *         description: Attribute value added
 *       403:
 *         description: Missing attribute:create
 *       404:
 *         description: Attribute not found
 */
router
  .route('/:id/values')
  .post(
    requirePermission('attribute:create'),
    validate(attributeValidation.addAttributeValue),
    attributeController.addAttributeValue,
  );

/**
 * @swagger
 * /api/attributes/{id}/values/{valueId}:
 *   patch:
 *     summary: Update an attribute value
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: string }
 *               displayValue: { type: string }
 *     responses:
 *       200:
 *         description: Attribute value updated
 *       403:
 *         description: Missing attribute:update
 *       404:
 *         description: Attribute or value not found
 *   delete:
 *     summary: Delete an attribute value
 *     description: Refused (409) if the value is currently used by any product variant.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attribute value deleted
 *       403:
 *         description: Missing attribute:delete
 *       404:
 *         description: Attribute or value not found
 *       409:
 *         description: Value is still used by product variants
 */
router
  .route('/:id/values/:valueId')
  .patch(
    requirePermission('attribute:update'),
    validate(attributeValidation.updateAttributeValue),
    attributeController.updateAttributeValue,
  )
  .delete(
    requirePermission('attribute:delete'),
    validate(attributeValidation.deleteAttributeValue),
    attributeController.deleteAttributeValue,
  );

/**
 * @swagger
 * /api/attributes/{id}:
 *   get:
 *     summary: Get an attribute by ID
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attribute with its values
 *       403:
 *         description: Missing attribute:read
 *       404:
 *         description: Attribute not found
 *   put:
 *     summary: Update an attribute
 *     tags: [Attribute]
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
 *               type: { type: string, enum: [text, color, size, material] }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Attribute updated
 *       403:
 *         description: Missing attribute:update
 *       404:
 *         description: Attribute not found
 *   delete:
 *     summary: Delete an attribute
 *     description: Refused (409) if the attribute has values still used by variants.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attribute deleted
 *       403:
 *         description: Missing attribute:delete
 *       404:
 *         description: Attribute not found
 *       409:
 *         description: Attribute still in use by product variants
 */
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
