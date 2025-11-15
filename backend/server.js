import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Carga .env
import authRoutes from './routes/auth.routes.js'; // Importa nuestras rutas
import usuarioRoutes from './routes/usuario.routes.js';
import laboratorioRoutes from './routes/laboratorio.routes.js';
import materiaRoutes from './routes/materia.routes.js';
import claseRoutes from './routes/clase.routes.js';
import horarioRoutes from './routes/horario.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';
import reporteRoutes from './routes/reporte.routes.js';
import grupoRoutes from './routes/grupo.routes.js';
import docenteRoutes from './routes/docente.routes.js';
import alumnoRoutes from './routes/alumno.routes.js';
import path from 'path'; // Necesitas importar path
import { fileURLToPath } from 'url'; // Para obtener __dirname con ES Modules
import adminRoutes from './routes/admin.routes.js';

// --- Define __dirname para ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----

// --- Inicialización ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite a Express entender JSON
app.use(express.urlencoded({ extended: true }));

// ¡AÑADE ESTA LÍNEA PARA SERVIR ARCHIVOS ESTÁTICOS!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --------------------------------------------------

// --- Rutas de la API ---
// Aquí le decimos a Express que use nuestras rutas de autenticación
// Todas las rutas en 'authRoutes' tendrán el prefijo '/api/auth'
app.use('/api/auth', authRoutes);

// (Aquí añadiremos las otras rutas en el futuro: /api/usuarios, /api/labs, etc.)

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/laboratorios', laboratorioRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/clases', claseRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/docentes', docenteRoutes);
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/admin', adminRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});


