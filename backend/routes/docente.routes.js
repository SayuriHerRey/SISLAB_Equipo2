import { Router } from 'express';
import multer from 'multer'; // <-- 1. Importa multer
import path from 'path'; // <-- 2. Importa path (para extensiones)
// Usamos protegerRuta (login) y esDocente (rol específico)
import { protegerRuta, esDocente } from '../middleware/auth.middleware.js'; 
import { 
  getMiPerfil, 
  getMisClases, 
  getMisMetricas,
  getAsistenciasClaseActual,
  getMisReportes,
  generarReporteAsistencia,
  changeMyPassword,
  updateMyProfilePhoto,
  getMiReporteById, // <-- Añade
  downloadMiReportePdf,
  getAllDocenteNames,
  downloadAsistenciaClasePdf // <-- Añade
} from '../controllers/docente.controller.js';


// --- Configuración de Multer ---
// Define dónde guardar y cómo nombrar los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Guarda en la carpeta 'uploads/'
  },
  filename: function (req, file, cb) {
    // Genera un nombre único: idUsuario-timestamp.extension
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${req.usuario.id}-${uniqueSuffix}`); 
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('¡Solo se permiten archivos de imagen!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // Límite de 5MB
// --------------------------------

const router = Router();

/**
 * @route   GET /api/docentes/nombres
 * @desc    Obtener lista de nombres/IDs de docentes activos (para filtros Admin)
 * @access  Autenticado (Admin la necesita)
 */
// ¡Va ANTES del router.use() específico de Docente!
router.get('/nombres', protegerRuta, getAllDocenteNames);

// Todas las rutas aquí requieren estar logueado Y ser docente
router.use(protegerRuta, esDocente); 

/**
 * @route   GET /api/docentes/mi-perfil
 * @desc    Obtener perfil básico y QR del docente logueado
 */
router.get('/mi-perfil', getMiPerfil);

/**
 * @route   GET /api/docentes/mis-clases
 * @desc    Obtener clases del docente logueado (opcional ?fecha=hoy)
 */
router.get('/mis-clases', getMisClases);

/**
 * @route   GET /api/docentes/mis-metricas
 * @desc    Obtener métricas para las tarjetas superiores
 */
router.get('/mis-metricas', getMisMetricas);

// (Aquí irán las rutas de asistencia, reportes, etc., después)

/**
 * @route   GET /api/docentes/asistencias/clase-actual
 * @desc    Get current class info and student attendance list
 */
// 2. ADD THIS ROUTE
router.get('/asistencias/clase-actual', getAsistenciasClaseActual);

/**
 * @route   GET /api/docentes/mis-reportes
 * @desc    Obtener lista de reportes generados por el docente logueado
 */
// 2. AÑADE ESTA RUTA
router.get('/mis-reportes', getMisReportes);

/**
 * @route   POST /api/docentes/reportes/generar-asistencia
 * @desc    Genera un reporte de asistencia para el docente logueado
 */
// 2. AÑADE ESTA RUTA
router.post('/reportes/generar-asistencia', generarReporteAsistencia);

/**
 * @route   PUT /api/docentes/mi-perfil/password
 * @desc    Cambiar la contraseña del docente logueado
 */
// 2. AÑADE ESTA RUTA
router.put('/mi-perfil/password', changeMyPassword);

/**
 * @route   PUT /api/docentes/mi-perfil/foto
 * @desc    Actualizar la foto de perfil del docente logueado
 * @access  Docente
 */
// 4. ¡AÑADE ESTA RUTA NUEVA!
// Usa el middleware 'upload.single('fotoPerfil')' para procesar el archivo
router.put(
  '/mi-perfil/foto', 
  upload.single('fotoPerfil'), // 'fotoPerfil' debe ser el 'name' del input file en el frontend
  updateMyProfilePhoto
);


/**
 * @route   GET /api/docentes/mis-reportes/:id
 * @desc    Obtener un reporte específico generado por el docente logueado
 */
router.get('/mis-reportes/:id', getMiReporteById);

/**
 * @route   GET /api/docentes/mis-reportes/:id/download
 * @desc    Descargar JSON de un reporte específico del docente logueado
 */
router.get('/mis-reportes/:id/download', downloadMiReportePdf);

/**
 * @route   GET /api/docentes/clase/:id/asistencia-pdf
 * @desc    Descargar PDF de lista de asistencia para una clase específica
 */
// 2. AÑADE ESTA RUTA
router.get('/clase/:id/asistencia-pdf', downloadAsistenciaClasePdf);
export default router;