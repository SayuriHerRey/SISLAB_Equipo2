import { Router } from 'express';
import { protegerRuta, esAdmin } from '../middleware/auth.middleware.js';
import { getAllReportes, getReporteById, downloadReportePdf,generarReporteAsistenciaGrupo, generarReporteGeneral } from '../controllers/reporte.controller.js'; // <-- Cambia a Pdf
const router = Router();

// Protegemos la ruta (solo Admin puede ver todos los reportes)
router.use(protegerRuta, esAdmin);

/**
 * @route   GET /api/reportes
 * @desc    Obtener todos los reportes generados
 */
router.get('/', getAllReportes);

// (Aquí irían POST, DELETE, etc., después)

/**
 * @route   GET /api/reportes/:id
 * @desc    Obtener un reporte específico por ID (Admin)
 */
router.get('/:id', getReporteById); 

/**
 * @route   GET /api/reportes/:id/download
 * @desc    Descargar el PDF de un reporte específico (Admin)
 */
router.get('/:id/download', downloadReportePdf);

/**
 * @route   POST /api/reportes/generar-asistencia-grupo
 * @desc    Genera un reporte de asistencia por grupo (Admin)
 */
// ¡NUEVA RUTA!
router.post('/generar-asistencia-grupo', generarReporteAsistenciaGrupo);

/**
 * @route   POST /api/reportes/generar-general
 * @desc    Genera un reporte de asistencia general (Admin)
 */
// ¡NUEVA RUTA!
router.post('/generar-general', generarReporteGeneral);

export default router;