import * as reporteModel from '../models/reporte.model.js';
import { generateAsistenciaPdfStream } from '../utils/pdfGenerator.js'; // <-- Importa el generador
import { query } from '../config/database.js';

export const getAllReportes = async (req, res) => {
  try {
    const filtros = {
      filtroTipo: req.query.tipo,
      filtroPeriodo: req.query.periodo, // <-- Asegúrate que esta línea exista
      filtroEstado: req.query.estado
    };
    const reportes = await reporteModel.findAll(filtros);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para OBTENER un reporte por ID (Usado por Admin y Docente)
 */
export const getReporteById = async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await reporteModel.findById(Number(id));
    
    // Verificación de permiso (Opcional pero recomendado): 
    // ¿Debería un docente solo poder ver sus propios reportes?
    // if (req.usuario.rol === 'docente' && reporte.generado_por !== req.usuario.id) {
    //   return res.status(403).json({ msg: 'No tienes permiso para ver este reporte.' });
    // }
    
    res.status(200).json(reporte);
  } catch (error) {
    // Si findById lanza "Reporte no encontrado", devuelve 404
    res.status(error.message.includes('encontrado') ? 404 : 500).json({ msg: error.message });
  }
};

/**
 * Controlador para DESCARGAR un reporte en PDF por ID (Admin)
 */
export const downloadReportePdf = async (req, res) => {
   try {
    const { id } = req.params;
    const reporte = await reporteModel.findById(Number(id));

    // (Verificación de permiso si fuera necesaria para Admin)

    if (!reporte.datos_reportados) {
        // Aunque pdfkit podría generar un PDF vacío, es mejor indicar que no hay datos.
        return res.status(404).json({ msg: 'El reporte no contiene datos para generar el PDF.' });
    }

    // Define el nombre del archivo PDF
    const fileName = `reporte_${reporte.tipo}_${id}.pdf`;
    
    // Establece cabeceras para PDF
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Genera el stream del PDF y lo envía como respuesta
    const pdfStream = generateAsistenciaPdfStream(reporte);
    pdfStream.pipe(res); // Envía el stream al cliente

  } catch (error) {
    console.error("Error generando PDF (Admin):", error);
    res.status(error.message.includes('encontrado') ? 404 : 500).json({ msg: error.message });
  }
};

/**
 * Generar un reporte de asistencia por GRUPO (POST /api/reportes/generar-asistencia-grupo)
 * (Llamado por el Admin)
 */
export const generarReporteAsistenciaGrupo = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; // ID del Admin que genera
    const { periodo, nombreGrupo } = req.body; // 'semana'/'mes' y el NOMBRE del grupo

    if (!periodo || !nombreGrupo) {
        return res.status(400).json({ msg: 'Faltan campos (periodo, nombreGrupo).' });
    }

    // Busca el ID del grupo a partir del nombre
    let id_grupo;
    try {
        const grupoRes = await query('SELECT id_grupo FROM grupos WHERE nombre = $1', [nombreGrupo]);
        if (grupoRes.rows.length === 0) throw new Error(); // Lanza error si no existe
        id_grupo = grupoRes.rows[0].id_grupo;
    } catch {
         return res.status(404).json({ msg: `Grupo '${nombreGrupo}' no encontrado.` });
    }

    // Llama al modelo para generar y guardar el reporte
    const nuevoReporte = await reporteModel.generateAsistenciaGrupoReport(id_usuario, id_grupo, periodo);
    
    res.status(201).json({ msg: `Reporte para grupo ${nombreGrupo} generado exitosamente.`, reporte: nuevoReporte });

  } catch (error) {
    // Captura errores como "Periodo no válido" o "No se encontraron clases"
    res.status(400).json({ msg: error.message }); 
  }
};

/**
 * Generar un reporte de asistencia GENERAL (POST /api/reportes/generar-general)
 * (Llamado por el Admin)
 */
export const generarReporteGeneral = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; // ID del Admin
    const { periodo } = req.body; // 'semana' o 'mes'

    if (!periodo) {
        return res.status(400).json({ msg: 'Falta especificar el periodo (semana/mes).' });
    }

    const nuevoReporte = await reporteModel.generateAsistenciaGeneralReport(id_usuario, periodo);
    
    res.status(201).json({ msg: `Reporte General (${periodo}) generado exitosamente.`, reporte: nuevoReporte });

  } catch (error) {
    // Captura errores
    res.status(400).json({ msg: error.message }); 
  }
};