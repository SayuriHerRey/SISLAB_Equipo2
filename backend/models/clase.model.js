import { query } from '../config/database.js';

/**
 * Modelo para OBTENER todas las clases y eventos
 * (Esta es la consulta más compleja, une 5 tablas)
 */
export const findAll = async () => {
  const sql = `
    SELECT 
      c.id_clase,
      c.fecha,
      c.hora_inicio,
      c.hora_fin,
      c.estado,
      c.tema_clase,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      g.nombre AS nombre_grupo,
      l.nombre AS nombre_laboratorio
    FROM 
      clases c
      JOIN horarios_materias hm ON c.id_horario = hm.id_horario
      JOIN materias m ON hm.id_materia = m.id_materia
      JOIN docentes d ON hm.id_docente = d.id_docente
      JOIN grupos g ON hm.id_grupo = g.id_grupo
      JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    ORDER BY 
      c.fecha DESC, c.hora_inicio ASC;
  `;
  try {
    const { rows } = await query(sql);
    return rows;
  } catch (error) {
    console.error('Error en modelo findAll clases:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para CREAR una nueva clase
 * (Nota: Requiere IDs, no nombres)
 */
export const create = async ({ id_horario, id_laboratorio, fecha, hora_inicio, hora_fin, estado, tema_clase }) => {
  const sql = `
    INSERT INTO clases (id_horario, id_laboratorio, fecha, hora_inicio, hora_fin, estado, tema_clase)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [id_horario, id_laboratorio, fecha, hora_inicio, hora_fin, estado || 'programada', tema_clase]);
    return rows[0];
  } catch (error) {
    console.error('Error en modelo create clase:', error.message);
    if (error.code === '23505') { // Error de 'unique constraint'
      throw new Error('Error: Ya existe una clase para ese horario en esa fecha.');
    }
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ACTUALIZAR una clase
 */
export const update = async (id, { id_horario, id_laboratorio, fecha, hora_inicio, hora_fin, estado, tema_clase }) => {
  const sql = `
    UPDATE clases
    SET 
      id_horario = $1,
      id_laboratorio = $2,
      fecha = $3,
      hora_inicio = $4,
      hora_fin = $5,
      estado = $6,
      tema_clase = $7
    WHERE id_clase = $8
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [id_horario, id_laboratorio, fecha, hora_inicio, hora_fin, estado, tema_clase, id]);
    if (rows.length === 0) throw new Error('Clase no encontrada');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo update clase:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ELIMINAR una clase
 */
export const remove = async (id) => {
  const sql = 'DELETE FROM clases WHERE id_clase = $1 RETURNING id_clase, tema_clase;';
  try {
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) throw new Error('Clase no encontrada');
    return rows[0];
  } catch (error) { // <-- ¡PARÉNTESIS AÑADIDO!
    console.error('Error en modelo remove clase:', error.message);
    throw new Error('Error en la base de datos');
  }
};