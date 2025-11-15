import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { getAllHorarios,createHorario,
  updateHorario,
  deleteHorario} from '../controllers/horario.controller.js';

const router = Router();

// Protegemos la ruta
router.use(protegerRuta, esAdmin);
// --- Rutas para la gestión de plantillas de horarios (SOLO ADMIN) ---
router.post('/', [protegerRuta, esAdmin], createHorario);
router.put('/:id', [protegerRuta, esAdmin], updateHorario);
router.delete('/:id', [protegerRuta, esAdmin], deleteHorario);
// ------------------------------------------------------------------

/**
 * @route   GET /api/horarios
 * @desc    Obtener todos los horarios (plantillas)
 */
router.get('/', protegerRuta, getAllHorarios);

export default router;