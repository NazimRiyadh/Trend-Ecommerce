import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import permissionValidation from './permission.validation.js';
import permissionController from './permission.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: List all permissions grouped by module
 *     description: Returns permissions grouped by module (PermissionGroup). Supports search and pagination. Requires permission:watch.
 *     tags: [Permissions]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by permission name or group name
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of permission groups with permissions
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permission:watch
 *   post:
 *     summary: Create a permission group with actions
 *     description: "Creates a named group (module) and ticking actions produces permission names like product:create. Permission names are normalised to lowercase. Requires permission:create."
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionGroupRequest'
 *           example:
 *             name: inventory
 *             description: Inventory management permissions
 *             actions: [watch, create, read, update, delete]
 *     responses:
 *       201:
 *         description: Permission group and permissions created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Missing permission:create
 *       409:
 *         description: Permission name already exists
 */
router
  .route('/')
  .get(requirePermission('permission:watch'), permissionController.getPermissionGroups)
  .post(requirePermission('permission:create'), validate(permissionValidation.createPermissionGroup), permissionController.createPermissionGroup);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     summary: Get a permission group by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permission group details
 *       403:
 *         description: Missing permission:read
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a permission group (add/remove actions)
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionGroupRequest'
 *     responses:
 *       200:
 *         description: Updated permission group
 *       403:
 *         description: Missing permission:update
 *   delete:
 *     summary: Delete a permission (cascades role links)
 *     description: Deletes the permission and removes it from all roles that held it (CASCADE).
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Missing permission:delete
 *       404:
 *         description: Not found
 */
router
  .route('/:id')
  .get(requirePermission('permission:read'), validate(permissionValidation.getPermissionGroup), permissionController.getPermissionGroup)
  .put(requirePermission('permission:update'), validate(permissionValidation.updatePermissionGroup), permissionController.updatePermissionGroup)
  .delete(requirePermission('permission:delete'), validate(permissionValidation.deletePermissionGroup), permissionController.deletePermissionGroup);

export default router;
