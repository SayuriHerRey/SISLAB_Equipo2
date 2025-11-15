import { query } from '../config/database.js';

// --- ¡AÑADE ESTE console.log PARA DEBUG! ---
console.log('--- Modelo horario.model.js CARGADO ---'); 

/**
 * Modelo para OBTENER todos los horarios (plantillas)
 * (Para los dropdowns del formulario de 'Clases')
 */
export const findAll = async () => {
  console.log('--- Modelo findAll horarios INICIADO ---'); // <-- Debug
  const sql = `
    SELECT 
      hm.id_horario,
      hm.dias_semana,
      hm.hora_inicio,
      hm.hora_fin,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      g.nombre AS nombre_grupo
    FROM 
      horarios_materias hm
      JOIN materias m ON hm.id_materia = m.id_materia
      JOIN docentes d ON hm.id_docente = d.id_docente
      JOIN grupos g ON hm.id_grupo = g.id_grupo
    WHERE 
      hm.activo = TRUE
    ORDER BY 
      m.nombre ASC, hm.dias_semana, hm.hora_inicio;
  `;
  try {
    const { rows } = await query(sql);
    console.log('--- Modelo findAll horarios ÉXITO ---'); // <-- Debug
    return rows;
  } catch (error) {
    console.error('Error en modelo findAll horarios:', error.message); // <-- Esto debería salir si falla
    throw new Error('Error en la base de datos');
  }
};

// --- ¡AÑADE ESTAS NUEVAS FUNCIONES! ---

/**
 * Modelo para CREAR una nueva plantilla de horario
 * (Recibe los IDs de materia, docente y grupo)
 */
export const create = async ({ id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin, periodo }) => {
  const sql = `
    INSERT INTO horarios_materias 
      (id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin, periodo)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin, periodo || null]);
    return rows[0];
  } catch (error) {
    console.error('Error en modelo create horario:', error.message);
    if (error.code === '23505') { // Error de 'unique constraint'
      throw new Error('Error: Esta combinación de horario (materia, docente, grupo, día, hora) ya existe.');
    }
    throw new Error('Error en la base de datos al crear el horario.');
  }
};

/**
 * Modelo para ACTUALIZAR una plantilla de horario
 */
export const update = async (id, { id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin, periodo, activo }) => {
  const sql = `
    UPDATE horarios_materias
    SET 
      id_materia = $1,
      id_docente = $2,
      id_grupo = $3,
      dias_semana = $4,
      hora_inicio = $5,
      hora_fin = $6,
      periodo = $7,
      activo = $8
    WHERE id_horario = $9
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin, periodo, activo, id]);
    if (rows.length === 0) throw new Error('Plantilla de horario no encontrada.');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo update horario:', error.message);
    if (error.code === '23505') {
      throw new Error('Error: La combinación de horario actualizada ya existe.');
    }
    throw new Error('Error en la base de datos al actualizar.');
  }
};

/**
 * Modelo para ELIMINAR (o desactivar) una plantilla de horario
 * (Por seguridad, es mejor desactivar 'activo = false' que borrar)
 */
export const remove = async (id) => {
  // --- Opción A: Desactivar (Recomendado) ---
  const sql = 'UPDATE horarios_materias SET activo = FALSE WHERE id_horario = $1 RETURNING id_horario;';
  
  // --- Opción B: Borrar (CUIDADO: Puede romper 'clases' si no tienes ON DELETE) ---
  // const sql = 'DELETE FROM horarios_materias WHERE id_horario = $1 RETURNING id_horario;';

  try {
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) throw new Error('Plantilla de horario no encontrada.');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo remove horario:', error.message);
    throw new Error('Error en la base de datos al eliminar.');
  }
};