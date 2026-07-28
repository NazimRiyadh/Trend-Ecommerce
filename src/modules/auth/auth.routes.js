import express from 'express';
import validate from '../../middleware/validate.js';
import authValidation from './auth.validation.js';
import authController from './auth.controller.js';

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh', validate(authValidation.refresh), authController.refresh);

// Logout requires token
router.post('/logout', authController.logout);

// Get Session
router.get('/session', authController.getSession);

export default router;
