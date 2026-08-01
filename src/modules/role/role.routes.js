import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import roleValidation from './role.validation.js';
import roleController from './role.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List all roles with user counts
 *     description: Paginated list of roles. Each row shows the user count. Requires role:watch.
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated roles list
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing role:watch
 *   post:
 *     summary: Create a role with permissions
 *     description: "Creates a role. Optionally pass permissionIds to assign permissions in one step, or set grantAll=true for a super admin role."
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *           examples:
 *             withPermissions:
 *               summary: Role with specific permissions
 *               value: { name: Editor, description: Can manage content, status: active, permissionIds: [] }
 *             grantAll:
 *               summary: Grant all permissions (Super Admin)
 *               value: { name: Super Admin 2, grantAll: true }
 *     responses:
 *       201:
 *         description: Role created
 *       403:
 *         description: Missing role:create
 *       409:
 *         description: Role name already exists
 */
router
  .route('/')
  .post(requirePermission('role:create'), validate(roleValidation.createRole), roleController.createRole)
  .get(requirePermission('role:watch'), roleController.getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get a role with full permission set
 *     description: Returns the role and all its permissions. The edit screen uses this to pre-tick the permission grid.
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role with permissions
 *       403:
 *         description: Missing role:read
 *       404:
 *         description: Role not found
 *   put:
 *     summary: Update a role (add/remove permissions)
 *     description: "Updates role details and permissions. Guarded: cannot remove role:update from the last role that holds it."
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       200:
 *         description: Updated role
 *       403:
 *         description: Missing role:update
 *       409:
 *         description: Cannot remove critical permission (only role holding it)
 *   delete:
 *     summary: Delete a role
 *     description: "Refused if users still hold this role (409). Deletes the role and all RolePermission join records."
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role deleted
 *       403:
 *         description: Missing role:delete
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role is assigned to users — cannot delete
 */
router
  .route('/:id')
  .get(requirePermission('role:read'), validate(roleValidation.getRole), roleController.getRole)
  .put(requirePermission('role:update'), validate(roleValidation.updateRole), roleController.updateRole)
  .delete(requirePermission('role:delete'), validate(roleValidation.deleteRole), roleController.deleteRole);

export default router;
