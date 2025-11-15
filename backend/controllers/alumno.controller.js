import * as alumnoModel from '../models/alumno.model.js';
import multer from 'multer';

/**
 * Obtener perfil básico del alumno logueado (GET /api/alumnos/mi-perfil)
 */
export const getMiPerfil = async (req, res) => {
  try {
    const id_usuario = req.usuario.id; 
    const perfil = await alumnoModel.findMiPerfil(id_usuario);
    res.status(200).json(perfil);
  } catch (error) {
    res.status(404).json({ msg: error.message }); 
  }
};

/**
 * Obtener clases del alumno logueado (GET /api/alumnos/mis-clases)
 * Acepta ?fecha=hoy, ?fecha=semana, ?fecha=YYYY-MM-DD
 */
export const getMisClases = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    // Necesitamos el id_grupo del alumno
    const perfil = await alumnoModel.findMiPerfil(id_usuario); 
    const id_grupo = perfil.id_grupo; // El modelo findMiPerfil debe devolver id_grupo

    if (!id_grupo) { // Si el alumno no tiene grupo asignado
        return res.status(200).json([]); // Devuelve lista vacía
    }

    const filtroFecha = req.query.fecha; 
    const clases = await alumnoModel.findMisClases(id_grupo, filtroFecha);
    res.status(200).json(clases);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Obtener métricas del alumno logueado (GET /api/alumnos/mis-metricas)
 */
export const getMisMetricas = async (req, res) => {
   try {
    const id_usuario = req.usuario.id;
    const perfil = await alumnoModel.findMiPerfil(id_usuario);
    const id_alumno = perfil.id_alumno;
    const id_grupo = perfil.id_grupo; 

    // Si no tiene grupo, algunas métricas podrían ser 0
    if (!id_grupo) {
       console.warn(`Alumno ${id_alumno} no tiene grupo asignado, métricas pueden ser incompletas.`);
    }

    const metricas = await alumnoModel.calculateMisMetricas(id_alumno, id_grupo);
    res.status(200).json(metricas);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Obtener historial de asistencias del alumno (GET /api/alumnos/mis-asistencias)
 */
export const getMisAsistencias = async (req, res) => {
   try {
     const id_usuario = req.usuario.id;
     const perfil = await alumnoModel.findMiPerfil(id_usuario);
     const id_alumno = perfil.id_alumno;

     const asistencias = await alumnoModel.findMisAsistencias(id_alumno);
     res.status(200).json(asistencias);
   } catch (error) {
     res.status(500).json({ msg: error.message });
   }
};

// (Aquí irían updateMiPerfil, cambiarPassword después)

/**
 * Cambiar la contraseña del alumno logueado (PUT /api/alumnos/mi-perfil/password)
 */
export const changeMyPassword = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; 
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
        return res.status(400).json({ msg: 'Faltan campos (contraseña actual y nueva).' });
    }
    if (nuevaPassword.length < 6) { 
        return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    await alumnoModel.changePassword(id_usuario, passwordActual, nuevaPassword);
    
    res.status(200).json({ msg: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    res.status(400).json({ msg: error.message }); 
  }
};

/**
 * Actualizar la foto de perfil del alumno (PUT /api/alumnos/mi-perfil/foto)
 */
export const updateMyProfilePhoto = async (req, res) => {
   try {
    const id_usuario = req.usuario.id; 

    if (!req.file) {
        return res.status(400).json({ msg: 'No se subió ningún archivo o el tipo no es válido.' });
    }

    const filePath = req.file.path; 

    const result = await alumnoModel.updateProfilePhotoPath(id_usuario, filePath);
    
    res.status(200).json({ 
        msg: 'Foto de perfil actualizada exitosamente.', 
        foto_perfil: result.foto_perfil 
    });

  } catch (error) {
     if (error instanceof multer.MulterError) {
        return res.status(400).json({ msg: `Error de Multer: ${error.message}` });
     }
    res.status(400).json({ msg: error.message }); 
  }
};