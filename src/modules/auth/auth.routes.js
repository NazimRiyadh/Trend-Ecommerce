import express from 'express';
import validate from '../../middleware/validate.js';
import authValidation from './auth.validation.js';
import authController from './auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Returns a short-lived access token (15 min) and a long-lived refresh token (30 days). The same error is returned for a wrong email and a wrong password — never reveals which was wrong.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             superAdmin:
 *               summary: Super Admin
 *               value: { email: 'admin@trendcommerce.com', password: 'admin123' }
 *             catalogManager:
 *               summary: Catalog Manager (limited access)
 *               value: { email: 'catalog@trendcommerce.com', password: 'catalog123' }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token. The refresh token is rotated on every use — the old token is immediately invalidated.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(authValidation.refresh), authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (revoke refresh token server-side)
 *     description: Invalidates the refresh token in the database. The old token stops working immediately. Clearing browser storage alone is NOT logout.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Get current session
 *     description: Returns the authenticated user, their role, and a flat list of all their permission names. The frontend uses this list to decide what to render.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/UserPublic'
 *                         role:
 *                           $ref: '#/components/schemas/RoleSummary'
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['product:watch', 'product:create', 'category:watch']
 *       401:
 *         description: Not authenticated
 */
router.get('/session', authController.getSession);

export default router;
