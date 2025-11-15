import * as usuarioModel from '../models/usuario.model.js';
// (Aquí importaremos 'bcrypt' y 'pg' cuando hagamos el POST)

/**
 * Controlador para OBTENER todos los usuarios (GET /api/usuarios)
 * Acepta query params: ?rol=alumno&grupo=ISC-8A&orden=z-a
 */
export const getAllUsuarios = async (req, res) => {
  try {
    // 1. Leemos los filtros desde req.query
    const filtros = {
      filtroRol: req.query.rol,
      filtroGrupo: req.query.grupo,
      orden: req.query.orden
    };

    // 2. Pasamos los filtros al modelo
    const usuarios = await usuarioModel.findAllUsuarios(filtros);

    res.status(200).json(usuarios);

  } catch (error) {
    console.error('Error en controlador getAllUsuarios:', error.message);
    res.status(500).json({ msg: error.message }); // Envía el mensaje de error
  }
};

/**
 * Controlador para CREAR un nuevo usuario (POST /api/usuarios)
 * (Alimenta la Vista 9: Modal 'Agregar Usuario')
 * (Lo dejaremos pendiente por ahora)
 */
export const createUsuario = async (req, res) => {
  const userData = req.body; 

  // 1. Validación básica (sin 'password')
  if (!userData.email || !userData.rol || !userData.nombre) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios (email, rol, nombre).' });
  }

  try {
    // 2. Renombramos el campo 'grupo' para que coincida con el backend
    // El formulario envía 'grupo', el backend espera 'id_grupo_nombre'
    if (userData.grupo) {
      userData.id_grupo_nombre = userData.grupo;
      delete userData.grupo;
    }

    // 3. Llamamos al modelo
    const nuevoUsuario = await usuarioModel.create(userData);

    res.status(201).json({ 
      msg: `Usuario '${userData.nombre}' (${userData.rol}) creado exitosamente.`,
      usuario: nuevoUsuario 
    });

  } catch (error) {
    console.error('Error en controlador createUsuario:', error.message);
    res.status(500).json({ msg: error.message });
  }
};


/**
 * Controlador para ELIMINAR un usuario (DELETE /api/usuarios/:id)
 */
export const deleteUsuario = async (req, res) => {
  // 1. Obtenemos el ID de los parámetros de la URL (ej. /api/usuarios/5)
  const { id } = req.params;

  try {
    // 2. Llamamos al modelo para eliminar
    const usuarioEliminado = await usuarioModel.remove(Number(id));

    // 3. Respondemos con éxito
    res.status(200).json({ 
      msg: `Usuario '${usuarioEliminado.email}' eliminado exitosamente.`
    });

  } catch (error) {
    console.error('Error en controlador deleteUsuario:', error.message);
    res.status(500).json({ msg: error.message });
  }
};

/**
 * Controlador para ACTUALIZAR un usuario (PUT /api/usuarios/:id)
 */
export const updateUsuario = async (req, res) => {
  // 1. Obtenemos el ID de los parámetros de la URL
  const { id } = req.params;
  // 2. Obtenemos los datos del formulario
  const userData = req.body;

  // 3. Renombramos 'grupo' (del form) a 'id_grupo_nombre' (para el modelo)
  if (userData.grupo) {
    userData.id_grupo_nombre = userData.grupo;
    delete userData.grupo;
  }
  
  // (Nota: Faltaría un checkbox 'activo' en el formulario, 
  // pero lo asumimos 'true' por ahora)
  userData.activo = true; 

  try {
    // 4. Llamamos al modelo para actualizar
    const usuarioActualizado = await usuarioModel.update(Number(id), userData);

    // 5. Respondemos con éxito
    res.status(200).json({ 
      msg: `Usuario '${usuarioActualizado.nombre}' actualizado exitosamente.`,
      usuario: usuarioActualizado 
    });

  } catch (error) {
    console.error('Error en controlador updateUsuario:', error.message);
    res.status(500).json({ msg: error.message });
  }
};

