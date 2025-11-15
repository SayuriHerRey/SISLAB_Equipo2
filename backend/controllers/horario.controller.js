import * as horarioModel from '../models/horario.model.js';

export const getAllHorarios = async (req, res) => {
  console.log('--- Controlador getAllHorarios INICIADO ---'); // <-- AÑADE ESTO
  try {
    const horarios = await horarioModel.findAll();
    // ...
    
    res.status(200).json(horarios);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// --- ¡AÑADE ESTAS NUEVAS FUNCIONES! ---

/**
 * CREAR una plantilla de horario (POST /api/horarios)
 */
export const createHorario = async (req, res) => {
  try {
    const { id_materia, id_docente, id_grupo, dias_semana, hora_inicio, hora_fin } = req.body;
    // Validación básica
    if (!id_materia || !id_docente || !id_grupo || !dias_semana || !hora_inicio || !hora_fin) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios (materia, docente, grupo, dia, horas).' });
    }
    const nuevoHorario = await horarioModel.create(req.body);
    res.status(201).json({ msg: 'Plantilla de horario creada exitosamente.', horario: nuevoHorario });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

/**
 * ACTUALIZAR una plantilla de horario (PUT /api/horarios/:id)
 */
export const updateHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const horarioActualizado = await horarioModel.update(Number(id), req.body);
    res.status(200).json({ msg: 'Plantilla de horario actualizada.', horario: horarioActualizado });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

/**
 * ELIMINAR (desactivar) una plantilla de horario (DELETE /api/horarios/:id)
 */
export const deleteHorario = async (req, res) => {
  try {
    const { id } = req.params;
    await horarioModel.remove(Number(id));
    res.status(200).json({ msg: 'Plantilla de horario eliminada/desactivada.' });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};