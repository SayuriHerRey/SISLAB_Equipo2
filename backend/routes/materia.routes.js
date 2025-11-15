import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { 
  getAllMaterias, 
  createMateria, 
  updateMateria, 
  deleteMateria 
} from '../controllers/materia.controller.js';

const router = Router();

// Protegemos todas las rutas de materias
router.use(protegerRuta, esAdmin);

/**
 * @route   GET /api/materias
 * @desc    Obtener todas las materias
 */
router.get('/', getAllMaterias);

/**
 * @route   POST /api/materias
 * @desc    Crear una nueva materia
 */
router.post('/', createMateria);

/**
 * @route   PUT /api/materias/:id
 * @desc    Actualizar una materia
 */
router.put('/:id', updateMateria);

/**
 * @route   DELETE /api/materias/:id
 * @desc    Eliminar una materia
 */
router.delete('/:id', deleteMateria);

export default router;