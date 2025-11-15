import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token
 * @access  Public
 */
router.post('/login', login);

export default router;