import express from 'express';
import validate from '../../middleware/validate.js';
import requirePermission from '../../middleware/permissionGuard.js';
import userValidation from './user.validation.js';
import userController from './user.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users with role and status
 *     description: Paginated list. Supports search by name or email, filter by roleId and isActive. Requires user:watch.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: roleId
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated users list
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing user:watch
 *   post:
 *     summary: Create a user account
 *     description: Role is required and never defaulted. Passwords are bcrypt-hashed. Requires user:create.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created (password not in response)
 *       400:
 *         description: Validation error (missing role, invalid email, etc.)
 *       403:
 *         description: Missing user:create
 *       409:
 *         description: Email already taken
 */
router
  .route('/')
  .post(requirePermission('user:create'), validate(userValidation.createUser), userController.createUser)
  .get(requirePermission('user:watch'), validate(userValidation.listUsers), userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details (no password in response)
 *       403:
 *         description: Missing user:read
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update a user (role, status, password, etc.)
 *     description: "Prevents self-escalation: cannot change own role. Deactivating clears the refresh token immediately."
 *     tags: [Users]
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
 *               email: { type: string }
 *               phone: { type: string }
 *               roleId: { type: string }
 *               isActive: { type: boolean }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Updated user
 *       403:
 *         description: Missing user:update OR self-escalation attempt
 *   delete:
 *     summary: Delete a user (hard delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Missing user:delete
 *       404:
 *         description: User not found
 */
router
  .route('/:id')
  .get(requirePermission('user:read'), validate(userValidation.getUser), userController.getUser)
  .put(requirePermission('user:update'), validate(userValidation.updateUser), userController.updateUser)
  .delete(requirePermission('user:delete'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
