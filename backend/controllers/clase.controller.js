import * as claseModel from '../models/clase.model.js';

/**
 * Controlador para OBTENER todas las clases (GET /api/clases)
 */
export const getAllClases = async (req, res) => {
  try {
    const clases = await claseModel.findAll();
    res.status(200).json(clases);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para CREAR una clase (POST /api/clases)
 */
export const createClase = async (req, res) => {
  try {
    // Validación básica (requiere que el frontend envíe los IDs)
    const { id_horario, id_laboratorio, fecha, hora_inicio, hora_fin } = req.body;
    if (!id_horario || !id_laboratorio || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios (IDs de horario/lab, fecha, horas).' });
    }
    
    const nuevaClase = await claseModel.create(req.body);
    res.status(201).json({ msg: 'Clase programada exitosamente.', clase: nuevaClase });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ACTUALIZAR una clase (PUT /api/clases/:id)
 */
export const updateClase = async (req, res) => {
  try {
    const { id } = req.params;
    const claseActualizada = await claseModel.update(Number(id), req.body);
    res.status(200).json({ msg: 'Clase actualizada exitosamente.', clase: claseActualizada });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ELIMINAR una clase (DELETE /api/clases/:id)
 */
export const deleteClase = async (req, res) => {
  try {
    const { id } = req.params;
    const claseEliminada = await claseModel.remove(Number(id));
    res.status(200).json({ msg: `Clase (ID: ${claseEliminada.id_clase}) eliminada.` });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};