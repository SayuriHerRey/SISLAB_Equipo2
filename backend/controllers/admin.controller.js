import * as adminModel from '../models/admin.model.js';
/**
 * Controlador para OBTENER las métricas del dashboard (GET /api/admin/metricas)
 */
export const getMetrics = async (req, res) => {
  try {
    const metricas = await adminModel.getDashboardMetrics();
    res.status(200).json(metricas);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};