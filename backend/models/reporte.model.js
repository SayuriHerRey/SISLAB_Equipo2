import { query } from '../config/database.js';

/**
 * Modelo para OBTENER todos los reportes generados (con filtros)
 */
export const findAll = async ({ filtroPeriodo = 'todos', filtroTipo = 'todos', filtroEstado = 'todos' } = {}) => {
  let sql = `
    SELECT 
      r.id_reporte, r.tipo, r.descripcion, r.fecha_generacion,
      r.rango_fecha_inicio, r.rango_fecha_fin, r.nombre_archivo,
      r.datos_reportados, u.username AS generado_por_username
    FROM 
      reportes r
      LEFT JOIN usuarios u ON r.generado_por = u.id_usuario
  `;
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // Filtro por Tipo (ej: 'mensual', 'clase')
  if (filtroTipo && filtroTipo !== 'todos') {
    whereClauses.push(`r.tipo = $${paramIndex}`);
    queryParams.push(filtroTipo);
    paramIndex++;
  }

  // --- ¡CAMBIO AQUÍ! Habilitar filtro de Periodo ---
  if (filtroPeriodo && filtroPeriodo !== 'todos') {
    const hoy = new Date();
    let fechaInicioFiltro;

    if (filtroPeriodo === 'semana') {
      // Calcula el inicio de esta semana (Lunes)
      const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1; 
      fechaInicioFiltro = new Date(hoy);
      fechaInicioFiltro.setDate(hoy.getDate() - diaSemana);
      fechaInicioFiltro.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'mes') {
      // Calcula el inicio de este mes
      fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), 1); 
    }
    
    if (fechaInicioFiltro) {
      // Filtra reportes cuyo *inicio* esté dentro del periodo seleccionado
      whereClauses.push(`r.rango_fecha_inicio >= $${paramIndex}`);
      queryParams.push(fechaInicioFiltro.toISOString().split('T')[0]);
      paramIndex++;
    }
  }
  // ------------------------------------------------

  // (Filtro por Estado sigue deshabilitado)

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  sql += ' ORDER BY r.fecha_generacion DESC;';

  try {
    const { rows } = await query(sql, queryParams);
    return rows;
  } catch (error) {
    console.error('Error en modelo findAll reportes con filtros:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para OBTENER reportes generados por un usuario específico (con más logs)
 */
export const findByGenerator = async (id_usuario) => {
  console.log('--- Modelo findByGenerator INICIADO ---'); 
  console.log(`Buscando reportes para id_usuario: ${id_usuario}`); // Log del ID
  const sql = `
    SELECT 
      r.id_reporte, r.tipo, r.descripcion, r.fecha_generacion,
      r.rango_fecha_inicio, r.rango_fecha_fin, r.nombre_archivo,
      r.datos_reportados
    FROM 
      reportes r
    WHERE 
      r.generado_por = $1
    ORDER BY 
      r.fecha_generacion DESC;
  `;
  try {
    console.log('--- Ejecutando SQL findByGenerator ---'); // <-- Log ANTES
    const { rows } = await query(sql, [id_usuario]);
    console.log(`--- SQL findByGenerator completada. Filas encontradas: ${rows.length} ---`); // <-- Log DESPUÉS
    return rows;
  } catch (error) {
    // --- LOG EXPLÍCITO DEL ERROR ---
    console.error('!!! ERROR CAPTURADO en modelo findByGenerator reportes:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Error Code (si existe):', error.code);
    // -------------------------------
    throw new Error('Error en la base de datos al buscar reportes.'); // Mantenemos el throw
  }
};

/**
 * Genera un reporte de asistencia para un docente en un periodo dado y lo guarda en la BD.
 */
export const generateAsistenciaReport = async (id_usuario_generador, id_docente, periodo) => {
  let fechaInicio;
  let fechaFin = new Date(); // Hoy por defecto
  let descripcionPeriodo;

  // 1. Determinar el rango de fechas según el periodo
  const hoy = new Date();
  if (periodo === 'semana') {
    descripcionPeriodo = 'Semanal';
    fechaInicio = new Date(hoy);
    // Retrocede al inicio de la semana (Lunes = 1, Domingo = 0)
    const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1; // Lunes=0, Domingo=6
    fechaInicio.setDate(hoy.getDate() - diaSemana);
    fechaInicio.setHours(0, 0, 0, 0); // Inicio del Lunes
  } else if (periodo === 'mes') {
    descripcionPeriodo = 'Mensual';
    fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Primer día del mes actual
  } else {
    // Podríamos añadir 'semestre' o un rango personalizado
    throw new Error('Periodo de reporte no válido.');
  }

  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = fechaFin.toISOString().split('T')[0];

  try {
    // 2. Consulta compleja para calcular estadísticas de asistencia
    const statsSql = `
        WITH ClasesDocentePeriodo AS (
            -- Selecciona las clases impartidas por el docente en el periodo
            SELECT c.id_clase, hm.id_grupo
            FROM clases c
            JOIN horarios_materias hm ON c.id_horario = hm.id_horario
            WHERE hm.id_docente = $1 
              AND c.fecha BETWEEN $2 AND $3
              AND c.estado IN ('finalizada', 'en_curso') -- Solo clases que ocurrieron o están ocurriendo
        ),
        AsistenciasPeriodo AS (
            -- Cuenta asistencias (presente/tardanza) para esas clases
            SELECT 
                cdp.id_clase,
                COUNT(a.id_asistencia) AS total_asistencias,
                SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
                SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas
            FROM ClasesDocentePeriodo cdp
            LEFT JOIN asistencias a ON cdp.id_clase = a.id_clase
            GROUP BY cdp.id_clase
        ),
        AlumnosPorGrupo AS (
             -- Cuenta cuántos alumnos hay en los grupos involucrados
             SELECT g.id_grupo, COUNT(al.id_alumno) as total_alumnos_grupo
             FROM grupos g
             JOIN alumnos al ON g.id_grupo = al.id_grupo
             WHERE g.id_grupo IN (SELECT DISTINCT id_grupo FROM ClasesDocentePeriodo)
             GROUP BY g.id_grupo
        ),
        TotalEsperado AS (
            -- Calcula el total de asistencias esperadas (clases * alumnos_por_grupo)
            SELECT SUM(apg.total_alumnos_grupo) as total_asistencias_esperadas
            FROM ClasesDocentePeriodo cdp
            JOIN AlumnosPorGrupo apg ON cdp.id_grupo = apg.id_grupo
        )
        -- Calcula los totales finales
        SELECT 
            COUNT(DISTINCT cdp.id_clase) AS total_clases_periodo,
            COALESCE(SUM(ap.total_asistencias), 0) AS total_asistencias_registradas,
            COALESCE(SUM(ap.presentes), 0) AS total_presentes,
            COALESCE(SUM(ap.tardanzas), 0) AS total_tardanzas,
            -- Asistencias esperadas (podría ser NULL si no hay alumnos en los grupos)
            (SELECT total_asistencias_esperadas FROM TotalEsperado) AS total_asistencias_esperadas
        FROM ClasesDocentePeriodo cdp
        LEFT JOIN AsistenciasPeriodo ap ON cdp.id_clase = ap.id_clase;
    `;
    
    const { rows: statsRows } = await query(statsSql, [id_docente, fechaInicioStr, fechaFinStr]);
    
    if (statsRows.length === 0) {
        throw new Error('No se encontraron clases para este docente en el periodo seleccionado.');
    }

    const stats = statsRows[0];
    const totalClases = parseInt(stats.total_clases_periodo);
    const totalRegistradas = parseInt(stats.total_asistencias_registradas);
    const totalPresentes = parseInt(stats.total_presentes);
    const totalTardanzas = parseInt(stats.total_tardanzas);
    const totalEsperadas = parseInt(stats.total_asistencias_esperadas) || 0; // Si es NULL, 0
    // Calculamos ausentes: Esperadas - (Presentes + Tardanzas)
    // Asegurándonos de que no sea negativo si hay más registros que esperados (raro)
    const totalAusentes = Math.max(0, totalEsperadas - (totalPresentes + totalTardanzas)); 
    // Porcentaje de asistencia sobre el total esperado
    const porcentajeAsistencia = totalEsperadas > 0 ? Math.round((totalPresentes + totalTardanzas) / totalEsperadas * 100) : 0;

    // 3. Formatear los datos para el JSONB
    const datosReportados = {
      periodo: periodo,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      totalClasesImpartidas: totalClases,
      totalAsistenciasEsperadas: totalEsperadas,
      totalAsistenciasRegistradas: totalRegistradas,
      detalles: {
        presentes: totalPresentes,
        tardanzas: totalTardanzas,
        ausentes: totalAusentes // Calculado
      },
      porcentajeAsistencia: porcentajeAsistencia
    };

    // 4. Insertar el reporte en la tabla 'reportes'
    const descripcion = `Reporte de Asistencia ${descripcionPeriodo} (${fechaInicioStr} a ${fechaFinStr})`;
    const insertSql = `
      INSERT INTO reportes (tipo, descripcion, generado_por, rango_fecha_inicio, rango_fecha_fin, datos_reportados)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *; -- Devuelve el reporte creado
    `;
    // CORRECTO:
    const insertValues = ['docente', descripcion, id_usuario_generador, fechaInicioStr, fechaFinStr, JSON.stringify(datosReportados)];
    
    const { rows: reportRows } = await query(insertSql, insertValues);
    
    return reportRows[0]; // Devuelve el objeto del reporte recién creado

  } catch (error) {
    console.error('Error en modelo generateAsistenciaReport:', error.message);
    // Devuelve el mensaje de error específico si lo lanzamos nosotros
    throw new Error(error.message || 'Error al generar el reporte de asistencia.'); 
  }
};

/**
 * Modelo para OBTENER un reporte específico por su ID
 */
export const findById = async (id_reporte) => {
  // Incluimos la unión con usuarios por si necesitamos mostrar quién lo generó
  const sql = `
    SELECT 
      r.*, 
      u.username AS generado_por_username 
    FROM reportes r
    LEFT JOIN usuarios u ON r.generado_por = u.id_usuario
    WHERE r.id_reporte = $1;
  `;
  try {
    const { rows } = await query(sql, [id_reporte]);
    if (rows.length === 0) {
      throw new Error('Reporte no encontrado.');
    }
    return rows[0]; // Devuelve el objeto completo del reporte
  } catch (error) {
    console.error('Error en modelo findById reportes:', error.message);
    throw error; // Lanza el error original (ej. "Reporte no encontrado")
  }
};

/**
 * Genera un reporte de asistencia para un GRUPO específico en un periodo y lo guarda.
 */
export const generateAsistenciaGrupoReport = async (id_usuario_generador, id_grupo, periodo) => {
  let fechaInicio;
  let fechaFin = new Date(); 
  let descripcionPeriodo;

  // 1. Determinar rango de fechas
  const hoy = new Date();
  if (periodo === 'semana') {
    descripcionPeriodo = 'Semanal';
    fechaInicio = new Date(hoy);
    const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1; 
    fechaInicio.setDate(hoy.getDate() - diaSemana);
    fechaInicio.setHours(0, 0, 0, 0); 
  } else if (periodo === 'mes') {
    descripcionPeriodo = 'Mensual';
    fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); 
  } else {
    throw new Error('Periodo de reporte no válido.');
  }

  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = fechaFin.toISOString().split('T')[0];

  // Necesitamos el nombre del grupo para la descripción
  let nombreGrupo = 'Desconocido';
  try {
      const grupoRes = await query('SELECT nombre FROM grupos WHERE id_grupo = $1', [id_grupo]);
      if (grupoRes.rows.length > 0) nombreGrupo = grupoRes.rows[0].nombre;
  } catch { /* Ignora si falla, usa 'Desconocido' */ }

  try {
    // 2. Consulta de estadísticas (filtrada por id_grupo)
    const statsSql = `
        WITH ClasesGrupoPeriodo AS (
            -- Clases del GRUPO en el periodo
            SELECT c.id_clase, hm.id_grupo 
            FROM clases c
            JOIN horarios_materias hm ON c.id_horario = hm.id_horario
            WHERE hm.id_grupo = $1 -- <-- Filtro por GRUPO
              AND c.fecha BETWEEN $2 AND $3
              AND c.estado IN ('finalizada', 'en_curso')
        ),
        AsistenciasPeriodo AS (
            -- Asistencias a esas clases
            SELECT 
                cgp.id_clase,
                COUNT(a.id_asistencia) AS total_asistencias,
                SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
                SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas
            FROM ClasesGrupoPeriodo cgp
            LEFT JOIN asistencias a ON cgp.id_clase = a.id_clase
            GROUP BY cgp.id_clase
        ),
        AlumnosDelGrupo AS (
             -- Total de alumnos en ESTE grupo
             SELECT COUNT(id_alumno) as total_alumnos_grupo
             FROM alumnos 
             WHERE id_grupo = $1 AND activo = TRUE
        ),
        TotalEsperado AS (
            -- Asistencias esperadas (clases * alumnos_en_grupo)
            SELECT 
               (SELECT COUNT(*) FROM ClasesGrupoPeriodo) * (SELECT total_alumnos_grupo FROM AlumnosDelGrupo) as total_asistencias_esperadas
        )
        -- Calcula totales finales
        SELECT 
            COUNT(DISTINCT cgp.id_clase) AS total_clases_periodo,
            COALESCE(SUM(ap.total_asistencias), 0) AS total_asistencias_registradas,
            COALESCE(SUM(ap.presentes), 0) AS total_presentes,
            COALESCE(SUM(ap.tardanzas), 0) AS total_tardanzas,
            (SELECT total_asistencias_esperadas FROM TotalEsperado) AS total_asistencias_esperadas
        FROM ClasesGrupoPeriodo cgp
        LEFT JOIN AsistenciasPeriodo ap ON cgp.id_clase = ap.id_clase;
    `;
    
    const { rows: statsRows } = await query(statsSql, [id_grupo, fechaInicioStr, fechaFinStr]);
    
    if (statsRows.length === 0 || !statsRows[0] || statsRows[0].total_clases_periodo === '0') {
        throw new Error(`No se encontraron clases para el grupo '${nombreGrupo}' en el periodo seleccionado.`);
    }

    // (Misma lógica de cálculo que en el reporte del docente)
    const stats = statsRows[0];
    const totalClases = parseInt(stats.total_clases_periodo);
    // ... (totalRegistradas, totalPresentes, totalTardanzas, totalEsperadas)
    const totalRegistradas = parseInt(stats.total_asistencias_registradas);
    const totalPresentes = parseInt(stats.total_presentes);
    const totalTardanzas = parseInt(stats.total_tardanzas);
    const totalEsperadas = parseInt(stats.total_asistencias_esperadas) || 0; 
    const totalAusentes = Math.max(0, totalEsperadas - (totalPresentes + totalTardanzas)); 
    const porcentajeAsistencia = totalEsperadas > 0 ? Math.round((totalPresentes + totalTardanzas) / totalEsperadas * 100) : 0;

    // 3. Formatear JSONB
    const datosReportados = {
      periodo: periodo,
      grupo: nombreGrupo, // Añade info del grupo
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      totalClasesImpartidas: totalClases,
      totalAsistenciasEsperadas: totalEsperadas,
      totalAsistenciasRegistradas: totalRegistradas,
      detalles: { presentes: totalPresentes, tardanzas: totalTardanzas, ausentes: totalAusentes },
      porcentajeAsistencia: porcentajeAsistencia
    };

    // 4. Insertar reporte
    const descripcion = `Reporte de Asistencia ${descripcionPeriodo} - Grupo ${nombreGrupo} (${fechaInicioStr} a ${fechaFinStr})`;
    const insertSql = `
      INSERT INTO reportes (tipo, descripcion, generado_por, rango_fecha_inicio, rango_fecha_fin, datos_reportados)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    // Usamos 'grupo' como el tipo
    const insertValues = ['grupo', descripcion, id_usuario_generador, fechaInicioStr, fechaFinStr, JSON.stringify(datosReportados)]; 
    
    const { rows: reportRows } = await query(insertSql, insertValues);
    return reportRows[0];

  } catch (error) {
    console.error('Error en modelo generateAsistenciaGrupoReport:', error.message);
    throw new Error(error.message || 'Error al generar el reporte por grupo.'); 
  }
};


/**
 * Genera un reporte de asistencia GENERAL (todos los grupos) en un periodo y lo guarda.
 */
export const generateAsistenciaGeneralReport = async (id_usuario_generador, periodo) => {
  let fechaInicio;
  let fechaFin = new Date(); 
  let descripcionPeriodo;

  // 1. Determinar rango de fechas
  const hoy = new Date();
  if (periodo === 'semana') {
    descripcionPeriodo = 'Semanal';
    fechaInicio = new Date(hoy);
    const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1; 
    fechaInicio.setDate(hoy.getDate() - diaSemana);
    fechaInicio.setHours(0, 0, 0, 0); 
  } else if (periodo === 'mes') {
    descripcionPeriodo = 'Mensual';
    fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); 
  } else {
    throw new Error('Periodo de reporte no válido.');
  }

  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = fechaFin.toISOString().split('T')[0];

  try {
    // 2. Consulta de estadísticas (SIN filtro de grupo o docente)
    const statsSql = `
        WITH ClasesPeriodo AS (
            -- TODAS las clases en el periodo
            SELECT c.id_clase, hm.id_grupo 
            FROM clases c
            JOIN horarios_materias hm ON c.id_horario = hm.id_horario
            WHERE c.fecha BETWEEN $1 AND $2 -- <-- Sin filtro de grupo/docente
              AND c.estado IN ('finalizada', 'en_curso')
        ),
        AsistenciasPeriodo AS (
            -- Asistencias a esas clases
            SELECT 
                cdp.id_clase,
                COUNT(a.id_asistencia) AS total_asistencias,
                SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
                SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas
            FROM ClasesPeriodo cdp
            LEFT JOIN asistencias a ON cdp.id_clase = a.id_clase
            GROUP BY cdp.id_clase
        ),
        AlumnosPorGrupo AS (
             -- Total de alumnos en CADA grupo
             SELECT id_grupo, COUNT(id_alumno) as total_alumnos_grupo
             FROM alumnos 
             WHERE activo = TRUE
             GROUP BY id_grupo
        ),
        ClasesPorGrupo AS (
            -- Conteo de clases POR GRUPO en el periodo
            SELECT id_grupo, COUNT(*) as total_clases_grupo
            FROM ClasesPeriodo
            GROUP BY id_grupo
        ),
        TotalEsperado AS (
            -- Asistencias esperadas (suma de (clases_de_grupo * alumnos_en_grupo))
            SELECT SUM(cpg.total_clases_grupo * apg.total_alumnos_grupo) as total_asistencias_esperadas
            FROM ClasesPorGrupo cpg
            JOIN AlumnosPorGrupo apg ON cpg.id_grupo = apg.id_grupo
        )
        -- Calcula totales finales
        SELECT 
            COUNT(DISTINCT cgp.id_clase) AS total_clases_periodo,
            COALESCE(SUM(ap.total_asistencias), 0) AS total_asistencias_registradas,
            COALESCE(SUM(ap.presentes), 0) AS total_presentes,
            COALESCE(SUM(ap.tardanzas), 0) AS total_tardanzas,
            (SELECT total_asistencias_esperadas FROM TotalEsperado) AS total_asistencias_esperadas
        FROM ClasesPeriodo cgp
        LEFT JOIN AsistenciasPeriodo ap ON cgp.id_clase = ap.id_clase;
    `;
    
    // Pasamos solo las fechas, sin ID de grupo
    const { rows: statsRows } = await query(statsSql, [fechaInicioStr, fechaFinStr]); 
    
    if (statsRows.length === 0 || !statsRows[0] || statsRows[0].total_clases_periodo === '0') {
        throw new Error('No se encontraron clases en el periodo seleccionado.');
    }

    // (Misma lógica de cálculo)
    const stats = statsRows[0];
    const totalClases = parseInt(stats.total_clases_periodo);
    const totalRegistradas = parseInt(stats.total_asistencias_registradas);
    const totalPresentes = parseInt(stats.total_presentes);
    const totalTardanzas = parseInt(stats.total_tardanzas);
    const totalEsperadas = parseInt(stats.total_asistencias_esperadas) || 0; 
    const totalAusentes = Math.max(0, totalEsperadas - (totalPresentes + totalTardanzas)); 
    const porcentajeAsistencia = totalEsperadas > 0 ? Math.round((totalPresentes + totalTardanzas) / totalEsperadas * 100) : 0;

    // 3. Formatear JSONB
    const datosReportados = {
      periodo: periodo,
      tipoReporte: 'general',
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      totalClasesImpartidas: totalClases,
      totalAsistenciasEsperadas: totalEsperadas,
      totalAsistenciasRegistradas: totalRegistradas,
      detalles: { presentes: totalPresentes, tardanzas: totalTardanzas, ausentes: totalAusentes },
      porcentajeAsistencia: porcentajeAsistencia
    };

    // 4. Insertar reporte
    const descripcion = `Reporte de Asistencia General ${descripcionPeriodo} (${fechaInicioStr} a ${fechaFinStr})`;
    const insertSql = `
      INSERT INTO reportes (tipo, descripcion, generado_por, rango_fecha_inicio, rango_fecha_fin, datos_reportados)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    // Usamos 'general' como el tipo
    const insertValues = ['general', descripcion, id_usuario_generador, fechaInicioStr, fechaFinStr, JSON.stringify(datosReportados)]; 
    
    const { rows: reportRows } = await query(insertSql, insertValues);
    return reportRows[0];

  } catch (error) {
    console.error('Error en modelo generateAsistenciaGeneralReport:', error.message);
    throw new Error(error.message || 'Error al generar el reporte general.'); 
  }
};