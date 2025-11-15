import * as docenteModel from '../models/docente.model.js';
import * as asistenciaModel from '../models/asistencia.model.js'; // <-- ¡AÑADE ESTA LÍNEA!
import * as reporteModel from '../models/reporte.model.js'; // <-- ¡Necesitamos importar reporteModel!
import { generateAsistenciaPdfStream, generateClaseAsistenciaPdfStream} from '../utils/pdfGenerator.js'; // <-- Importa el generador
/**
 * Obtener perfil básico del docente logueado (GET /api/docentes/mi-perfil)
 */
export const getMiPerfil = async (req, res) => {
  try {
    // Obtenemos el id_usuario del token (añadido por protegerRuta)
    const id_usuario = req.usuario.id; 
    const perfil = await docenteModel.findMiPerfil(id_usuario);
    res.status(200).json(perfil);
  } catch (error) {
    res.status(404).json({ msg: error.message }); // 404 si no se encuentra
  }
};

/**
 * Obtener clases del docente logueado (GET /api/docentes/mis-clases)
 * Acepta ?fecha=hoy o ?fecha=YYYY-MM-DD
 */
export const getMisClases = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    // Primero obtenemos el id_docente correspondiente al id_usuario
    const perfil = await docenteModel.findMiPerfil(id_usuario); // Reutilizamos findMiPerfil
    const id_docente = perfil.id_docente;

    const filtroFecha = req.query.fecha; // Lee el query param 'fecha'
    const clases = await docenteModel.findMisClases(id_docente, filtroFecha);
    res.status(200).json(clases);
  } catch (error) {
     // Si findMiPerfil falla (docente no encontrado), también da error
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Obtener métricas del docente logueado (GET /api/docentes/mis-metricas)
 */
export const getMisMetricas = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    const perfil = await docenteModel.findMiPerfil(id_usuario);
    const id_docente = perfil.id_docente;

    const metricas = await docenteModel.calculateMisMetricas(id_docente);
    res.status(200).json(metricas);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Get current active class and student attendance (GET /api/docentes/asistencias/clase-actual)
 */
export const getAsistenciasClaseActual = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    // We need the id_docente first
    const perfil = await docenteModel.findMiPerfil(id_usuario); 
    const id_docente = perfil.id_docente;

    const data = await docenteModel.findAsistenciasClaseActual(id_docente);
    res.status(200).json(data); // Returns { claseActual: {...} or null, asistencias: [...] }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Obtener reportes generados por el docente logueado (GET /api/docentes/mis-reportes)
 */
export const getMisReportes = async (req, res) => {
    console.log('--- Controlador getMisReportes INICIADO ---');
   try {
    // El id_usuario viene del token (middleware protegerRuta)
    const id_usuario_generador = req.usuario.id; 

    const reportes = await reporteModel.findByGenerator(id_usuario_generador);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Generar un reporte de asistencia (POST /api/docentes/reportes/generar-asistencia)
 */
export const generarReporteAsistencia = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    const { periodo } = req.body; // 'semana' o 'mes'

    if (!periodo) {
        return res.status(400).json({ msg: 'Falta especificar el periodo (semana/mes).' });
    }

    // Necesitamos el id_docente
    const perfil = await docenteModel.findMiPerfil(id_usuario);
    const id_docente = perfil.id_docente;

    // Llamamos a la función del modelo de reportes
    const nuevoReporte = await reporteModel.generateAsistenciaReport(id_usuario, id_docente, periodo);
    
    res.status(201).json({ msg: 'Reporte generado exitosamente.', reporte: nuevoReporte });

  } catch (error) {
    // Captura errores como "Periodo no válido" o "No se encontraron clases"
    res.status(400).json({ msg: error.message }); 
  }
};

/**
 * Cambiar la contraseña del docente logueado (PUT /api/docentes/mi-perfil/password)
 */
export const changeMyPassword = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; // Del token
    const { passwordActual, nuevaPassword } = req.body;

    // Validación básica
    if (!passwordActual || !nuevaPassword) {
        return res.status(400).json({ msg: 'Faltan campos (contraseña actual y nueva).' });
    }
    if (nuevaPassword.length < 6) { // Coincide con tu validación frontend
        return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    // Llama al modelo para verificar y actualizar
    await docenteModel.changePassword(id_usuario, passwordActual, nuevaPassword);
    
    res.status(200).json({ msg: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    // Captura errores como "Usuario no encontrado" o "Contraseña actual incorrecta"
    res.status(400).json({ msg: error.message }); 
  }
};

/**
 * Actualizar la foto de perfil del docente (PUT /api/docentes/mi-perfil/foto)
 */
export const updateMyProfilePhoto = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; 

    // Multer añade 'req.file' si la subida fue exitosa
    if (!req.file) {
        return res.status(400).json({ msg: 'No se subió ningún archivo o el tipo no es válido.' });
    }

    // req.file.path contiene la ruta donde se guardó el archivo (ej: uploads/id-timestamp.jpg)
    const filePath = req.file.path; 

    // Llama al modelo para guardar la ruta en la BD
    const result = await docenteModel.updateProfilePhotoPath(id_usuario, filePath);
    
    res.status(200).json({ 
        msg: 'Foto de perfil actualizada exitosamente.', 
        foto_perfil: result.foto_perfil // Devuelve la nueva ruta
    });

  } catch (error) {
     // Maneja errores específicos (ej. archivo muy grande, tipo inválido)
     if (error instanceof multer.MulterError) {
        return res.status(400).json({ msg: `Error de Multer: ${error.message}` });
     }
    res.status(400).json({ msg: error.message }); 
  }
};

/**
 * Obtener un reporte específico generado por el docente logueado
 * (Reutiliza la lógica de reporte.controller pero añade verificación)
 */
export const getMiReporteById = async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await reporteModel.findById(Number(id)); // Usa el modelo directamente

    // ¡Verificación específica! Asegura que el reporte sea del docente logueado
    if (reporte.generado_por !== req.usuario.id) {
       return res.status(403).json({ msg: 'No tienes permiso para ver este reporte.' });
    }
    
    res.status(200).json(reporte);
  } catch (error) {
    res.status(error.message.includes('encontrado') ? 404 : 500).json({ msg: error.message });
  }
};

/**
 * Descargar PDF de un reporte específico generado por el docente
 */
 export const downloadMiReportePdf = async (req, res) => {
   try {
    const { id } = req.params;
    const reporte = await reporteModel.findById(Number(id)); 

    // Verificación específica del docente
    if (reporte.generado_por !== req.usuario.id) {
       return res.status(403).json({ msg: 'No tienes permiso para descargar este reporte.' });
    }
    if (!reporte.datos_reportados) {
        return res.status(404).json({ msg: 'El reporte no contiene datos para generar el PDF.' });
    }

    const fileName = `reporte_${reporte.tipo}_${id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    const pdfStream = generateAsistenciaPdfStream(reporte);
    pdfStream.pipe(res);

  } catch (error) {
    console.error("Error generando PDF (Docente):", error);
    res.status(error.message.includes('encontrado') ? 404 : 500).json({ msg: error.message });
  }
 };

 /**
 * Obtener lista de nombres/IDs de docentes (GET /api/docentes/nombres)
 */
export const getAllDocenteNames = async (req, res) => {
   try {
    const docentes = await docenteModel.findAllNames();
    res.status(200).json(docentes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Descargar PDF de la lista de asistencia de una clase específica
 * (GET /api/docentes/clase/:id/asistencia-pdf)
 */
export const downloadAsistenciaClasePdf = async (req, res) => {
  try {
    const { id: id_clase } = req.params; // ID de la clase
    const id_usuario = req.usuario.id;

    // 1. Obtener datos para el PDF
    const { claseInfo, asistencias } = await asistenciaModel.findAsistenciaDataForPdf(Number(id_clase));
    
    // 2. Verificar permiso (que el docente que pide el PDF sea el docente de esa clase)
    const perfil = await docenteModel.findMiPerfil(id_usuario);
    // Compara por nombre (o mejor por id_docente si lo trajeras en claseInfo)
    if (claseInfo.nombre_docente !== perfil.nombre) { 
       return res.status(403).json({ msg: 'No tienes permiso para descargar la lista de esta clase.' });
    }

    // 3. Generar y enviar el PDF
    const fileName = `Asistencia_${claseInfo.nombre_materia}_${claseInfo.nombre_grupo}_${claseInfo.fecha}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    const pdfStream = generateClaseAsistenciaPdfStream(claseInfo, asistencias);
    pdfStream.pipe(res);

  } catch (error) {
    console.error("Error generando PDF de asistencia de clase:", error);
    res.status(error.message.includes('encontrada') ? 404 : 500).json({ msg: error.message });
  }
};