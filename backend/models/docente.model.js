import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
/**
 * Obtener el perfil básico del docente logueado (incluye QR)
 */
export const findMiPerfil = async (id_usuario) => {
  const sql = `
    SELECT 
      d.id_docente, d.nombre, d.no_empleado, d.email, d.especialidad, 
      d.foto_perfil, d.qr_code, d.fecha_contratacion,
      dep.nombre AS nombre_departamento 
    FROM docentes d
    LEFT JOIN departamentos dep ON d.id_departamento = dep.id_departamento
    WHERE d.id_usuario = $1 AND d.activo = TRUE;
  `;
  try {
    const { rows } = await query(sql, [id_usuario]);
    if (rows.length === 0) throw new Error('Perfil de docente no encontrado o inactivo.');
    return rows[0];
  } catch (error) {
    console.error("Error en modelo findMiPerfil:", error.message);
    throw error;
  }
};

/**
 * Obtener las clases programadas para el docente logueado
 * (Puede filtrar por fecha, ej: solo hoy)
 */
export const findMisClases = async (id_docente, filtroFecha = null) => {
  let sql = `
    SELECT 
      c.id_clase, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.tema_clase,
      m.nombre AS nombre_materia,
      g.nombre AS nombre_grupo,
      l.nombre AS nombre_laboratorio,
      l.ubicacion AS ubicacion_laboratorio
    FROM clases c
    JOIN horarios_materias hm ON c.id_horario = hm.id_horario
    JOIN materias m ON hm.id_materia = m.id_materia
    JOIN grupos g ON hm.id_grupo = g.id_grupo
    JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    WHERE hm.id_docente = $1
  `;
  const params = [id_docente];
  let paramIndex = 2;

  if (filtroFecha === 'hoy') {
    sql += ` AND c.fecha = CURRENT_DATE`;
  } else if (filtroFecha) { // Si se pasa una fecha específica YYYY-MM-DD
    sql += ` AND c.fecha = $${paramIndex}`;
    params.push(filtroFecha);
    paramIndex++;
  }
  
  sql += ` ORDER BY c.fecha ASC, c.hora_inicio ASC;`;

  try {
    const { rows } = await query(sql, params);
    return rows;
  } catch (error) {
    console.error("Error en modelo findMisClases:", error.message);
    throw new Error('Error en la base de datos al buscar clases.');
  }
};


/**
 * Calcular las métricas para las tarjetas superiores del docente
 */
export const calculateMisMetricas = async (id_docente) => {
  try {
    // Clases Hoy
    const clasesHoyRes = await query(
      `SELECT COUNT(*) FROM clases c 
       JOIN horarios_materias hm ON c.id_horario=hm.id_horario 
       WHERE hm.id_docente = $1 AND c.fecha = CURRENT_DATE`, [id_docente]);
    
    // Total Clases (del periodo actual, o histórico? Por ahora, histórico)
     const totalClasesRes = await query(
      `SELECT COUNT(*) FROM clases c 
       JOIN horarios_materias hm ON c.id_horario=hm.id_horario 
       WHERE hm.id_docente = $1`, [id_docente]); // Podría filtrar por periodo

    // Asistencias Hoy (Solo alumnos, el docente marca la suya)
    const asistenciasHoyRes = await query(
      `SELECT COUNT(a.*) FROM asistencias a
       JOIN clases cl ON a.id_clase = cl.id_clase
       JOIN horarios_materias hm ON cl.id_horario = hm.id_horario
       WHERE hm.id_docente = $1 AND DATE(a.hora_ingreso) = CURRENT_DATE`, [id_docente]);

    // Materias distintas que imparte (basado en horarios asignados)
    const materiasRes = await query(
      `SELECT COUNT(DISTINCT hm.id_materia) FROM horarios_materias hm 
       WHERE hm.id_docente = $1 AND hm.activo = TRUE`, [id_docente]);

    return {
      clasesHoy: parseInt(clasesHoyRes.rows[0].count) || 0,
      totalClases: parseInt(totalClasesRes.rows[0].count) || 0,
      asistenciasHoy: parseInt(asistenciasHoyRes.rows[0].count) || 0,
      totalMaterias: parseInt(materiasRes.rows[0].count) || 0
    };
  } catch (error) {
     console.error("Error en modelo calculateMisMetricas:", error.message);
     throw new Error('Error en la base de datos al calcular métricas.');
  }
};

export const findAsistenciasClaseActual = async (id_docente) => {
  // 1. Find the currently active class for this teacher
  const ahora = new Date();
  const horaActual = ahora.toTimeString().split(' ')[0]; // HH:MM:SS
  const fechaActual = ahora.toISOString().split('T')[0]; // YYYY-MM-DD

  const queryClaseActiva = `
      SELECT c.id_clase, m.nombre AS nombre_materia, g.nombre AS nombre_grupo, l.nombre AS nombre_laboratorio, c.hora_inicio, c.hora_fin
      FROM clases c
      JOIN horarios_materias hm ON c.id_horario = hm.id_horario
      JOIN materias m ON hm.id_materia = m.id_materia
      JOIN grupos g ON hm.id_grupo = g.id_grupo
      JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
      WHERE hm.id_docente = $1 
        AND c.fecha = $2 
        AND c.hora_inicio <= $3 
        AND c.hora_fin >= $3
        AND c.estado IN ('programada', 'en_curso')
      ORDER BY c.hora_inicio DESC -- In case of overlap, take the latest starting one
      LIMIT 1; 
  `; 
  
  try {
    const resClase = await query(queryClaseActiva, [id_docente, fechaActual, horaActual]);

    if (resClase.rows.length === 0) {
      // No active class found for the teacher right now
      return { claseActual: null, asistencias: [] }; 
    }
    
    const claseActual = resClase.rows[0];
    const idClaseActiva = claseActual.id_clase;

    // 2. Find student attendances for this active class
    const queryAsistencias = `
      SELECT 
        a.id_asistencia,
        al.nombre AS nombre_alumno,
        al.matricula,
        al.email,
        g.nombre AS grupo_alumno, -- Student's group
        a.hora_ingreso,
        a.estado,
        al.foto_perfil
      FROM 
        asistencias a
        JOIN alumnos al ON a.id_alumno = al.id_alumno
        LEFT JOIN grupos g ON al.id_grupo = g.id_grupo
      WHERE 
        a.id_clase = $1
      ORDER BY 
        a.hora_ingreso ASC; -- Show earliest first
    `;
    
    const resAsistencias = await query(queryAsistencias, [idClaseActiva]);
    
    return { claseActual: claseActual, asistencias: resAsistencias.rows };

  } catch (error) {
     console.error("Error in model findAsistenciasClaseActual:", error.message);
     throw new Error('Error fetching current class attendance from database.');
  }
};

/**
 * Cambia la contraseña del docente logueado.
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
     console.error("Error buscando hash actual:", error);
     throw new Error("Error al verificar usuario.");
  }

  // 2. Comparar la contraseña actual proporcionada con el hash de la BD
  const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
  if (!isMatch) {
    throw new Error('La contraseña actual es incorrecta.');
  }

  // 3. Hashear la nueva contraseña
  const salt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);

  // 4. Actualizar la contraseña en la tabla 'usuarios'
  try {
    const updateRes = await query(
      'UPDATE usuarios SET password = $1 WHERE id_usuario = $2 RETURNING id_usuario', 
      [newHashedPassword, id_usuario]
    );
    return updateRes.rows[0]; // Confirma la actualización
  } catch (error) {
     console.error("Error actualizando contraseña:", error);
     throw new Error("Error al guardar la nueva contraseña.");
  }
};

/**
 * Actualiza la ruta de la foto de perfil para un docente.
 */
export const updateProfilePhotoPath = async (id_usuario, filePath) => {
  // Construimos la ruta relativa para guardar en BD (ej: /uploads/id-timestamp.jpg)
  // IMPORTANTE: Asegúrate que tu servidor pueda servir archivos estáticos desde /uploads
  const relativePath = filePath.replace(/\\/g, '/').replace('uploads/', '/uploads/'); // Normaliza la ruta

  const sql = `
    UPDATE docentes 
    SET foto_perfil = $1 
    WHERE id_usuario = $2 
    RETURNING foto_perfil;`;
  try {
    const { rows } = await query(sql, [relativePath, id_usuario]);
    if (rows.length === 0) throw new Error('Docente no encontrado.');
    return rows[0]; // Devuelve la nueva ruta guardada
  } catch (error) {
    console.error("Error actualizando ruta de foto:", error);
    throw new Error("Error al guardar la ruta de la foto.");
  }
};

/**
 * Obtener lista de IDs y nombres de docentes activos
 * (Para dropdowns)
 */
export const findAllNames = async () => {
  const sql = 'SELECT id_docente, nombre FROM docentes WHERE activo = TRUE ORDER BY nombre ASC;';
  try {
    const { rows } = await query(sql);
    return rows; // Devuelve [{id_docente: 1, nombre: '...'}, ...]
  } catch (error) {
    console.error("Error en modelo findAllNames (docente):", error.message);
    throw new Error('Error al obtener lista de docentes.');
  }
};