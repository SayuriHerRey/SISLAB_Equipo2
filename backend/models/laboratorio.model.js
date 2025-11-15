import { query } from '../config/database.js';

/**
 * Modelo para OBTENER todos los laboratorios
 */
export const findAll = async () => {
  const sql = 'SELECT * FROM laboratorios ORDER BY nombre ASC;';
  try {
    const { rows } = await query(sql);
    return rows;
  } catch (error) {
    console.error('Error en modelo findAll labs:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para CREAR un nuevo laboratorio
 */
export const create = async ({ nombre, ubicacion, capacidad, equipamiento }) => {
  const sql = `
    INSERT INTO laboratorios (nombre, ubicacion, capacidad, equipamiento, estado)
    VALUES ($1, $2, $3, $4, 'disponible')
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [nombre, ubicacion, capacidad, equipamiento]);
    return rows[0];
  } catch (error) {
    console.error('Error en modelo create lab:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ACTUALIZAR un laboratorio
 */
export const update = async (id, { nombre, ubicacion, capacidad, equipamiento, estado }) => {
  const sql = `
    UPDATE laboratorios
    SET 
      nombre = $1,
      ubicacion = $2,
      capacidad = $3,
      equipamiento = $4,
      estado = $5
    WHERE id_laboratorio = $6
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [nombre, ubicacion, capacidad, equipamiento, estado, id]);
    if (rows.length === 0) throw new Error('Laboratorio no encontrado');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo update lab:', error.message);
    throw new Error('Error en la base de datos');
  }
};

/**
 * Modelo para ELIMINAR un laboratorio
 */
export const remove = async (id) => {
  const sql = 'DELETE FROM laboratorios WHERE id_laboratorio = $1 RETURNING nombre;';
  try {
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) throw new Error('Laboratorio no encontrado');
    return rows[0];
  } catch (error) {
    console.error('Error en modelo remove lab:', error.message);
    throw new Error('Error en la base de datos');
  }
};