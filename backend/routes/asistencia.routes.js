import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
// ¡AÑADE createAsistencia!
import { getAsistenciasHoy, createAsistencia, getClaseActivaGeneral } from '../controllers/asistencia.controller.js';

const router = Router();

// El GET requiere ser Admin
router.get('/hoy', protegerRuta, esAdmin, getAsistenciasHoy);

/**
 * @route   POST /api/asistencias/registrar
 * @desc    Registrar una asistencia mediante QR Code
 * @access  Public (Temporalmente, para quiosco) 
 */
// ¡RUTA ABIERTA! No requiere login ahora.
router.post('/registrar', createAsistencia); 

/**
 * @route   GET /api/asistencias/clase-activa
 * @desc    Obtener info de la (primera) clase activa general
 * @access  Public
 */
// --- ¡NUEVA RUTA PÚBLICA! ---
router.get('/clase-activa', getClaseActivaGeneral);

export default router;