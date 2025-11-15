import { query } from '../config/database.js';

/**
 * Modelo para OBTENER todos los nombres de grupos activos
/**
 * Modelo para OBTENER todos los nombres e IDs de grupos activos
 */
export const findAllNames = async () => {
  // ¡CAMBIO! Selecciona id_grupo y nombre
  const sql = 'SELECT id_grupo, nombre FROM grupos WHERE activo = TRUE ORDER BY nombre ASC;';
  try {
    const { rows } = await query(sql);
    // ¡CAMBIO! Devuelve el array de objetos completo
    return rows; // Devuelve [{id_grupo: 1, nombre: '...'}, ...]
  } catch (error) {
    console.error('Error en modelo findAllNames grupos:', error.message);
    throw new Error('Error en la base de datos');
  }
};
// (Podríamos añadir CRUD completo para grupos si fuera necesario después)