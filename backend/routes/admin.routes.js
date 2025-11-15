import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { getMetrics } from '../controllers/admin.controller.js';

const router = Router();

// Todas las rutas aquí requieren ser Admin
router.use(protegerRuta, esAdmin);

/**
 * @route   GET /api/admin/metricas
 * @desc    Obtener las métricas (contadores) para el dashboard del Admin
 */
router.get('/metricas', getMetrics);

export default router;