import * as materiaModel from '../models/materia.model.js';

/**
 * Controlador para OBTENER todas las materias (GET /api/materias)
 */
/**
 * Controlador para OBTENER todas las materias (GET /api/materias)
 * Acepta query params: ?materia=Redes&docente=Juan
 */
/**
 * Controlador para OBTENER todas las materias (GET /api/materias)
 * Acepta query params: ?materia=...&docenteId=...
 */
export const getAllMaterias = async (req, res) => {
  try {
    const filtros = {
      filtroMateria: req.query.materia,
      filtroDocenteId: req.query.docenteId // <-- Lee el ID del docente
    };
    const materias = await materiaModel.findAll(filtros);
    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
/**
 * Controlador para CREAR una materia (POST /api/materias)
 */
export const createMateria = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.nombre || !req.body.clave) {
      return res.status(400).json({ msg: 'Nombre y clave son obligatorios.' });
    }
    const nuevaMateria = await materiaModel.create(req.body);
    res.status(201).json({ msg: 'Materia creada exitosamente.', materia: nuevaMateria });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ACTUALIZAR una materia (PUT /api/materias/:id)
 */
export const updateMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaActualizada = await materiaModel.update(Number(id), req.body);
    res.status(200).json({ msg: 'Materia actualizada exitosamente.', materia: materiaActualizada });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ELIMINAR una materia (DELETE /api/materias/:id)
 */
export const deleteMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaEliminada = await materiaModel.remove(Number(id));
    res.status(200).json({ msg: `Materia '${materiaEliminada.nombre}' eliminada.` });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};