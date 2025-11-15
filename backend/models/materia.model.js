import { query } from '../config/database.js';

/**
 * Modelo para OBTENER todas las materias
 * (Hacemos JOIN con Carreras para obtener el nombre)
 */
/**
 * Modelo para OBTENER todas las materias (con filtros opcionales)
 */
/**
 * Modelo para OBTENER todas las materias (con filtros por nombre y/o id_docente)
 */
export const findAll = async ({ filtroMateria = null, filtroDocenteId = null } = {}) => {
  // Base de la consulta
  let sql = `
    SELECT DISTINCT -- Usa DISTINCT para evitar duplicados si un docente da la materia a varios grupos
      m.id_materia, m.nombre, m.clave, m.creditos, m.descripcion, m.semestre_recomendado, m.activo,
      c.nombre AS nombre_carrera,
      m.id_carrera -- Incluye id_carrera por si se necesita
    FROM materias m
    LEFT JOIN carreras c ON m.id_carrera = c.id_carrera
  `;
  const joinClauses = [];
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // Si se filtra por docente, necesitamos unir con horarios_materias
  if (filtroDocenteId && filtroDocenteId !== 'todos') {
    // Añade el JOIN necesario
    joinClauses.push('JOIN horarios_materias hm ON m.id_materia = hm.id_materia');
    // Añade la condición WHERE para el docente
    whereClauses.push(`hm.id_docente = $${paramIndex}`);
    queryParams.push(filtroDocenteId);
    paramIndex++;
  }

  // Filtro por nombre de materia (se mantiene)
  if (filtroMateria && filtroMateria !== 'todos' && filtroMateria.trim() !== '') {
    whereClauses.push(`m.nombre ILIKE $${paramIndex}`); 
    queryParams.push(`%${filtroMateria.trim()}%`); 
    paramIndex++;
  }

  // Une las cláusulas JOIN
  if (joinClauses.length > 0) {
    sql += ' ' + joinClauses.join(' ');
  }
  // Une las cláusulas WHERE
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  sql += ' ORDER BY m.nombre ASC;'; // Orden final

  try {
    const { rows } = await query(sql, queryParams);
    return rows;
  } catch (error) {
    console.error('Error en modelo findAll materias con filtros (docente):', error.message);
    throw new Error('Error en la base de datos');
  }
};
/**
 * Modelo para CREAR una nueva materia
 */
export const create = async ({ nombre, clave, creditos, descripcion, id_carrera, semestre_recomendado }) => {
  const sql = `
    INSERT INTO materias (nombre, clave, creditos, descripcion, id_carrera, semestre_recomendado)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [nombre, clave, creditos, descripcion, id_carrera, semestre_recomendado]);
    return rows[0];
  } catch (error) {
    console.error('Error en modelo create materia:', error.message);
    if (error.code === '23505') { // Error de clave única
      throw new Error(`Error: La clave de materia '${clave}' ya existe.`);
    }
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ACTUALIZAR una materia
 */
export const update = async (id, { nombre, clave, creditos, descripcion, id_carrera, semestre_recomendado }) => {
  const sql = `
    UPDATE materias
    SET 
      nombre = $1,
      clave = $2,
      creditos = $3,
      descripcion = $4,
      id_carrera = $5,
      semestre_recomendado = $6
    WHERE id_materia = $7
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [nombre, clave, creditos, descripcion, id_carrera, semestre_recomendado, id]);
    if (rows.length === 0) throw new Error('Materia no encontrada');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo update materia:', error.message);
    if (error.code === '23505') { // Error de clave única
      throw new Error(`Error: La clave de materia '${clave}' ya existe.`);
    }
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ELIMINAR una materia
 */
export const remove = async (id) => {
  const sql = 'DELETE FROM materias WHERE id_materia = $1 RETURNING nombre;';
  try {
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) throw new Error('Materia no encontrada');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo remove materia:', error.message);
    throw new Error('Error en la base de datos');
  }
};