import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { 
  getAllClases, 
  createClase, 
  updateClase, 
  deleteClase 
} from '../controllers/clase.controller.js';

const router = Router();

// Protegemos todas las rutas de clases
router.use(protegerRuta, esAdmin);

/**
 * @route   GET /api/clases
 * @desc    Obtener todas las clases programadas
 */
router.get('/', getAllClases);

/**
 * @route   POST /api/clases
 * @desc    Programar una nueva clase
 */
router.post('/', createClase);

/**
 * @route   PUT /api/clases/:id
 * @desc    Actualizar una clase
 */
router.put('/:id', updateClase);

/**
 * @route   DELETE /api/clases/:id
 * @desc    Eliminar (cancelar) una clase
 */
router.delete('/:id', deleteClase);

export default router;