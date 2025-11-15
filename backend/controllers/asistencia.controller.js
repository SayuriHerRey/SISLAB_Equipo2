import * as asistenciaModel from '../models/asistencia.model.js';

/**
 * Controlador para OBTENER las asistencias de hoy (GET /api/asistencias/hoy)
 */
export const getAsistenciasHoy = async (req, res) => {
  try {
    const asistencias = await asistenciaModel.findToday();
    res.status(200).json(asistencias);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// (Aquí irá 'createAsistencia' después)
/**
 * Controlador para REGISTRAR una asistencia (POST /api/asistencias/registrar)
 */
export const createAsistencia = async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({ msg: 'Falta el código QR.' });
  }

  try {
    // Llamamos al modelo para hacer toda la lógica
    const resultado = await asistenciaModel.create(qrCode);
    
    // Respondemos con los datos del usuario/docente y la hora
    res.status(200).json(resultado); 

  } catch (error) {
    // Capturamos los errores específicos del modelo (ej. "QR no encontrado")
    res.status(400).json({ msg: error.message });
  }
};

/**
 * Controlador para OBTENER la clase activa general (GET /api/asistencias/clase-activa)
 * (Para la pantalla de registro pública)
 */
export const getClaseActivaGeneral = async (req, res) => {
  try {
    const clase = await asistenciaModel.findClaseActivaGeneral();
    if (!clase) {
      // Si no hay clase, no es un error, solo no hay datos
      return res.status(200).json(null); 
    }
    res.status(200).json(clase);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Obtiene los datos necesarios para un reporte de asistencia de una CLASE específica
 * (Info de la clase + Lista de alumnos)
 */
export const findAsistenciaDataForPdf = async (id_clase) => {
  let claseInfo, asistencias;

  // 1. Obtener información de la clase
  const claseSql = `
    SELECT 
      c.id_clase, c.fecha, c.hora_inicio, c.hora_fin,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      g.nombre AS nombre_grupo,
      l.nombre AS nombre_laboratorio
    FROM clases c
    JOIN horarios_materias hm ON c.id_horario = hm.id_horario
    JOIN materias m ON hm.id_materia = m.id_materia
    JOIN docentes d ON hm.id_docente = d.id_docente
    JOIN grupos g ON hm.id_grupo = g.id_grupo
    JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    WHERE c.id_clase = $1;
  `;
  try {
    const { rows } = await query(claseSql, [id_clase]);
    if (rows.length === 0) throw new Error('Clase no encontrada.');
    claseInfo = rows[0];
  } catch (error) {
    console.error("Error en findAsistenciaDataForPdf (Info Clase):", error.message);
    throw error;
  }

  // 2. Obtener lista de asistencias de alumnos
  const asistenciasSql = `
    SELECT 
      al.nombre AS nombre_alumno,
      al.matricula,
      a.hora_ingreso,
      a.estado
    FROM asistencias a
    JOIN alumnos al ON a.id_alumno = al.id_alumno
    WHERE a.id_clase = $1
    ORDER BY al.nombre ASC;
  `;
  try {
    const { rows } = await query(asistenciasSql, [id_clase]);
    asistencias = rows;
  } catch (error) {
    console.error("Error en findAsistenciaDataForPdf (Lista Asistencias):", error.message);
    throw new Error('Error al obtener la lista de asistencias.');
  }

  return { claseInfo, asistencias };
};