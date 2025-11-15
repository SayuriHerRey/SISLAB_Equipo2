import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
// (Pronto crearemos este controlador)
import { 
  getAllUsuarios, 
  createUsuario,
  deleteUsuario,  // <--- AÑADE ESTE
  updateUsuario
} from '../controllers/usuario.controller.js';

const router = Router();

// Definimos las rutas para /api/usuarios

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (para la tabla de Gestión de Usuarios)
 * @access  Admin
 */
router.get(
  '/', 
  [protegerRuta, esAdmin], // <--- ¡Protegido!
  getAllUsuarios
);

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario (para el modal 'Agregar Usuario')
 * @access  Admin
 */
router.post(
  '/', 
  [protegerRuta, esAdmin], // <--- ¡Protegido!
  createUsuario
);

// (Aquí añadiremos PUT y DELETE después)
router.delete(
  '/:id', 
  [protegerRuta, esAdmin], // <-- Protegido
  deleteUsuario
);

router.put(
  '/:id', 
  [protegerRuta, esAdmin], // <-- Protegido
  updateUsuario
);

export default router;