import { Router } from 'express';
import multer from 'multer'; // <-- 1. Importa multer
import path from 'path'; // <-- 2. Importa path
// Usamos protegerRuta (login) y esAlumno (rol específico)
import { protegerRuta, esAlumno } from '../middleware/auth.middleware.js'; 
import { 
  getMiPerfil, 
  getMisClases, 
  getMisMetricas,
  getMisAsistencias,
  changeMyPassword, // <-- 3. Importa las nuevas
  updateMyProfilePhoto // <-- Importa la nueva función
} from '../controllers/alumno.controller.js';

// --- Configuración de Multer (igual que en docente.routes.js) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${req.usuario.id}-${uniqueSuffix}`); 
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) { cb(null, true); } 
  else { cb(new Error('¡Solo se permiten imágenes!'), false); }
};
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

// Todas las rutas aquí requieren estar logueado Y ser alumno
router.use(protegerRuta, esAlumno); 

/**
 * @route   GET /api/alumnos/mi-perfil
 * @desc    Obtener perfil básico y QR del alumno logueado
 */
router.get('/mi-perfil', getMiPerfil);

/**
 * @route   GET /api/alumnos/mis-clases
 * @desc    Obtener clases del alumno logueado (opcional ?fecha=hoy, ?fecha=semana)
 */
router.get('/mis-clases', getMisClases);

/**
 * @route   GET /api/alumnos/mis-metricas
 * @desc    Obtener métricas para las tarjetas superiores
 */
router.get('/mis-metricas', getMisMetricas);

/**
 * @route   GET /api/alumnos/mis-asistencias
 * @desc    Obtener historial de asistencias del alumno
 */
router.get('/mis-asistencias', getMisAsistencias); // <-- Nueva ruta


// (Aquí irán las rutas PUT para perfil y contraseña)
/**
 * @route   PUT /api/alumnos/mi-perfil/password
 * @desc    Cambiar la contraseña del alumno logueado
 */
// 4. AÑADE RUTA PASSWORD
router.put('/mi-perfil/password', changeMyPassword);

/**
 * @route   PUT /api/alumnos/mi-perfil/foto
 * @desc    Actualizar la foto de perfil del alumno logueado
 */
// 5. AÑADE RUTA FOTO (con middleware multer)
router.put(
  '/mi-perfil/foto', 
  upload.single('fotoPerfil'), 
  updateMyProfilePhoto
);

export default router;