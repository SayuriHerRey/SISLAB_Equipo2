import { Router } from 'express';
// Solo necesitamos 'protegerRuta' ya que cualquier usuario logueado podría necesitar la lista
import { protegerRuta } from '../middleware/auth.middleware.js'; 
import { getAllGrupoNames } from '../controllers/grupo.controller.js';

const router = Router();

// Protegemos la ruta (requiere login, pero no ser admin)
router.use(protegerRuta);

/**
 * @route   GET /api/grupos/nombres
 * @desc    Obtener lista de nombres de grupos activos
 */
router.get('/nombres', getAllGrupoNames);

// (Aquí iría el CRUD completo de grupos si se necesitara)

export default router;