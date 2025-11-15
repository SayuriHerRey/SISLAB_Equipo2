import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Obtener el perfil básico del alumno logueado (incluye QR)
 */
export const findMiPerfil = async (id_usuario) => {
 const sql = `
 SELECT 
 a.id_alumno, a.nombre, a.matricula, a.email, a.foto_perfil, a.qr_code, 
a.fecha_registro,
 g.nombre AS nombre_grupo,
 c.nombre AS nombre_carrera,
a.id_grupo -- <-- ¡AÑADE ESTA LÍNEA!
FROM alumnos a
LEFT JOIN grupos g ON a.id_grupo = g.id_grupo
LEFT JOIN carreras c ON a.id_carrera = c.id_carrera
WHERE a.id_usuario = $1 AND a.activo = TRUE;
 `;
 try {
 const { rows } = await query(sql, [id_usuario]);
if (rows.length === 0) throw new Error('Perfil de alumno no encontrado o inactivo.');
 return rows[0];
 } catch (error) {
 console.error("Error en modelo findMiPerfil (alumno):", error.message);
 throw error;
 }
};
/**
 * Obtener las clases programadas para el alumno logueado
 * (Basado en su grupo)
 */
export const findMisClases = async (id_grupo, filtroFecha = null) => {
  // Si el alumno no tiene grupo, no tiene clases asignadas
  if (!id_grupo) return []; 
  
  let sql = `
    SELECT 
      c.id_clase, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.tema_clase,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      l.nombre AS nombre_laboratorio,
      hm.dias_semana -- Necesitamos el día para la vista semanal
    FROM clases c
    JOIN horarios_materias hm ON c.id_horario = hm.id_horario
    JOIN materias m ON hm.id_materia = m.id_materia
    JOIN docentes d ON hm.id_docente = d.id_docente
    JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    WHERE hm.id_grupo = $1 
  `;
  const params = [id_grupo];
  let paramIndex = 2;

  if (filtroFecha === 'hoy') {
    sql += ` AND c.fecha = CURRENT_DATE`;
  } else if (filtroFecha === 'semana') {
     // Filtra por la semana actual (Lunes a Sábado/Domingo)
     // La lógica exacta depende de cómo defines 'semana' en PostgreSQL
     sql += ` AND c.fecha >= date_trunc('week', CURRENT_DATE) AND c.fecha < date_trunc('week', CURRENT_DATE) + interval '1 week'`;
  } else if (filtroFecha) { 
    sql += ` AND c.fecha = $${paramIndex}`;
    params.push(filtroFecha);
    paramIndex++;
  }
  
  // Ordenamos para la vista semanal
  sql += ` ORDER BY c.fecha ASC, c.hora_inicio ASC;`; 

  try {
    const { rows } = await query(sql, params);
    
    // Convertimos 'dias_semana' a un formato usable si es necesario
    // O ajustamos la consulta para obtener el día de la semana de c.fecha
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return rows.map(row => ({
        ...row,
        // Añadimos el nombre del día basado en la fecha
        dia: dias[new Date(row.fecha).getDay()] 
    }));

  } catch (error) {
    console.error("Error en modelo findMisClases (alumno):", error.message);
    throw new Error('Error en la base de datos al buscar clases.');
  }
};

/**
 * Obtener el historial de asistencias del alumno
 */
export const findMisAsistencias = async (id_alumno) => {
   const sql = `
     SELECT a.id_asistencia, a.hora_ingreso, a.estado, cl.fecha 
     FROM asistencias a 
     JOIN clases cl ON a.id_clase = cl.id_clase
     WHERE a.id_alumno = $1 
     ORDER BY a.hora_ingreso DESC;
   `;
   try {
     const { rows } = await query(sql, [id_alumno]);
     return rows;
   } catch (error) {
     console.error("Error en modelo findMisAsistencias:", error.message);
     throw new Error('Error en la base de datos al buscar asistencias.');
   }
};

/**
 * Calcular las métricas para las tarjetas superiores del alumno
 */
export const calculateMisMetricas = async (id_alumno, id_grupo) => {
  try {
    // Clases Esta Semana (usa la misma lógica que findMisClases con filtro 'semana')
    const clasesSemanaRes = await query(
       `SELECT COUNT(c.*) FROM clases c
        JOIN horarios_materias hm ON c.id_horario = hm.id_horario
        WHERE hm.id_grupo = $1 
          AND c.fecha >= date_trunc('week', CURRENT_DATE) 
          AND c.fecha < date_trunc('week', CURRENT_DATE) + interval '1 week'`, [id_grupo]);
    const clasesEstaSemana = parseInt(clasesSemanaRes.rows[0]?.count) || 0;

    // Asistencias Totales (del alumno)
    const asistenciasTotalesRes = await query(
      `SELECT COUNT(*) FROM asistencias WHERE id_alumno = $1`, [id_alumno]);
    const asistenciasTotales = parseInt(asistenciasTotalesRes.rows[0]?.count) || 0;

    // Porcentaje Asistencia (Asistencias / Clases programadas para él hasta hoy)
    // Contamos las clases programadas para su grupo hasta la fecha actual
     const totalClasesProgramadasRes = await query(
       `SELECT COUNT(c.*) FROM clases c
        JOIN horarios_materias hm ON c.id_horario = hm.id_horario
        WHERE hm.id_grupo = $1 AND c.fecha <= CURRENT_DATE`, [id_grupo]);
     const totalClasesProgramadas = parseInt(totalClasesProgramadasRes.rows[0]?.count) || 0;
     const porcentajeAsistencia = totalClasesProgramadas > 0 
       ? Math.round((asistenciasTotales / totalClasesProgramadas) * 100) 
       : 0;

    // Materias Inscritas (basado en los horarios de su grupo)
    const materiasRes = await query(
      `SELECT COUNT(DISTINCT hm.id_materia) FROM horarios_materias hm 
       WHERE hm.id_grupo = $1 AND hm.activo = TRUE`, [id_grupo]);
    const totalMaterias = parseInt(materiasRes.rows[0]?.count) || 0;

    return {
      clasesEstaSemana: clasesEstaSemana,
      asistenciasTotales: asistenciasTotales,
      porcentajeAsistencia: porcentajeAsistencia,
      totalMaterias: totalMaterias
    };
  } catch (error) {
     console.error("Error en modelo calculateMisMetricas (alumno):", error.message);
     throw new Error('Error en la base de datos al calcular métricas.');
  }
};

/**
 * Cambia la contraseña del alumno logueado.
 * Verifica la contraseña actual antes de actualizar.
 */
export const changePassword = async (id_usuario, currentPassword, newPassword) => {
  // 1. Obtener el hash actual de la BD
  let currentUser;
  try {
    const res = await query('SELECT password FROM usuarios WHERE id_usuario = $1', [id_usuario]);
    if (res.rows.length === 0) throw new Error('Usuario no encontrado.');
    currentUser = res.rows[0];
  } catch (error) {
     console.error("Error buscando hash actual (alumno):", error);
     throw new Error("Error al verificar usuario.");
  }

  // 2. Comparar la contraseña actual
  const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
  if (!isMatch) {
    throw new Error('La contraseña actual es incorrecta.');
  }

  // 3. Hashear la nueva contraseña
  const salt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);

  // 4. Actualizar en la tabla 'usuarios'
  try {
    const updateRes = await query(
      'UPDATE usuarios SET password = $1 WHERE id_usuario = $2 RETURNING id_usuario', 
      [newHashedPassword, id_usuario]
    );
    return updateRes.rows[0]; 
  } catch (error) {
     console.error("Error actualizando contraseña (alumno):", error);
     throw new Error("Error al guardar la nueva contraseña.");
  }
};

/**
 * Actualiza la ruta de la foto de perfil para un alumno.
 */
export const updateProfilePhotoPath = async (id_usuario, filePath) => {
  // Normaliza la ruta para guardarla (igual que en docente)
  const relativePath = filePath.replace(/\\/g, '/').replace('uploads/', '/uploads/'); 

  const sql = `
    UPDATE alumnos 
    SET foto_perfil = $1 
    WHERE id_usuario = $2 
    RETURNING foto_perfil;`;
  try {
    const { rows } = await query(sql, [relativePath, id_usuario]);
    if (rows.length === 0) throw new Error('Alumno no encontrado.');
    return rows[0]; 
  } catch (error) {
    console.error("Error actualizando ruta de foto (alumno):", error);
    throw new Error("Error al guardar la ruta de la foto.");
  }
};