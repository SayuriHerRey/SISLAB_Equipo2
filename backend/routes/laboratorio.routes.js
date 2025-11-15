import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { 
  getAllLabs, 
  createLab, 
  updateLab, 
  deleteLab 
} from '../controllers/laboratorio.controller.js';

const router = Router();

// Todas estas rutas están protegidas y solo son para Admins
router.use(protegerRuta, esAdmin);

/**
 * @route   GET /api/laboratorios
 * @desc    Obtener todos los laboratorios
 */
router.get('/', getAllLabs);

/**
 * @route   POST /api/laboratorios
 * @desc    Crear un nuevo laboratorio
 */
router.post('/', createLab);

/**
 * @route   PUT /api/laboratorios/:id
 * @desc    Actualizar un laboratorio
 */
router.put('/:id', updateLab);

/**
 * @route   DELETE /api/laboratorios/:id
 * @desc    Eliminar un laboratorio
 */
router.delete('/:id', deleteLab);

export default router;