import { query } from '../config/database.js';

/**
 * Calcula las métricas principales para el Dashboard del Admin.
 * (Total laboratorios, usuarios, asistencias de hoy, reportes)
 */
export const getDashboardMetrics = async () => {
  try {
    // 1. Contar Laboratorios
    const labPromise = query('SELECT COUNT(*) FROM laboratorios WHERE activo = TRUE');
    
    // 2. Contar Usuarios (todos los roles)
    const userPromise = query('SELECT COUNT(*) FROM usuarios WHERE activo = TRUE');
    
    // 3. Contar Asistencias de HOY (Alumnos + Docentes)
    const asistenciasHoyPromise = query(`
      SELECT 
        (SELECT COUNT(*) FROM asistencias WHERE DATE(hora_ingreso) = CURRENT_DATE) +
        (SELECT COUNT(*) FROM asistencias_docentes WHERE DATE(hora_ingreso) = CURRENT_DATE)
      AS total_asistencias_hoy;
    `);

    // 4. Contar Reportes
    const reportesPromise = query('SELECT COUNT(*) FROM reportes');

    // Ejecutamos todas las consultas en paralelo
    const [
      labRes,
      userRes,
      asistenciasRes,
      reportesRes
    ] = await Promise.all([labPromise, userPromise, asistenciasHoyPromise, reportesPromise]);

    // Formateamos la respuesta
    return {
      laboratorios: parseInt(labRes.rows[0].count) || 0,
      usuarios: parseInt(userRes.rows[0].count) || 0,
      asistenciasHoy: parseInt(asistenciasRes.rows[0].total_asistencias_hoy) || 0,
      reportes: parseInt(reportesRes.rows[0].count) || 0
    };

  } catch (error) {
    console.error('Error en modelo getDashboardMetrics:', error.message);
    throw new Error('Error al calcular las métricas del dashboard.');
  }
};

