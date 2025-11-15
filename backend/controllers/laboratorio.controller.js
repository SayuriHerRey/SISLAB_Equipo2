import * as labModel from '../models/laboratorio.model.js';

/**
 * Controlador para OBTENER todos los laboratorios (GET /api/laboratorios)
 */
export const getAllLabs = async (req, res) => {
  try {
    const laboratorios = await labModel.findAll();
    res.status(200).json(laboratorios);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para CREAR un laboratorio (POST /api/laboratorios)
 */
export const createLab = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.nombre || !req.body.capacidad) {
      return res.status(400).json({ msg: 'Nombre y capacidad son obligatorios.' });
    }
    const nuevoLab = await labModel.create(req.body);
    res.status(201).json({ msg: 'Laboratorio creado exitosamente.', lab: nuevoLab });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ACTUALIZAR un laboratorio (PUT /api/laboratorios/:id)
 */
export const updateLab = async (req, res) => {
  try {
    const { id } = req.params;
    const labActualizado = await labModel.update(Number(id), req.body);
    res.status(200).json({ msg: 'Laboratorio actualizado exitosamente.', lab: labActualizado });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ELIMINAR un laboratorio (DELETE /api/laboratorios/:id)
 */
export const deleteLab = async (req, res) => {
  try {
    const { id } = req.params;
    const labEliminado = await labModel.remove(Number(id));
    res.status(200).json({ msg: `Laboratorio '${labEliminado.nombre}' eliminado.` });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};