import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Busca un usuario por su email en la tabla 'usuarios'
 * y también obtiene su perfil (admin, docente o alumno)
 * (Esta función ya la teníamos)
 */
export const findUserByEmailWithProfile = async (email) => {
  const sql = `
    SELECT 
      u.id_usuario, u.username, u.email, u.password, u.rol, u.activo,
      CASE
        WHEN u.rol = 'admin' THEN a.nombre
        WHEN u.rol = 'docente' THEN d.nombre
        WHEN u.rol = 'alumno' THEN al.nombre
        ELSE NULL
      END AS nombre_perfil,
      CASE
        WHEN u.rol = 'admin' THEN a.foto_perfil
        WHEN u.rol = 'docente' THEN d.foto_perfil
        WHEN u.rol = 'alumno' THEN al.foto_perfil
        ELSE '/default-avatar.png'
      END AS foto_perfil,
      CASE
        WHEN u.rol = 'admin' THEN a.id_admin
        WHEN u.rol = 'docente' THEN d.id_docente
        WHEN u.rol = 'alumno' THEN al.id_alumno
        ELSE NULL
      END AS id_perfil
    FROM 
      usuarios u
      LEFT JOIN admins a ON u.id_usuario = a.id_usuario AND u.rol = 'admin'
      LEFT JOIN docentes d ON u.id_usuario = d.id_usuario AND u.rol = 'docente'
      LEFT JOIN alumnos al ON u.id_usuario = al.id_usuario AND u.rol = 'alumno'
    WHERE 
      u.email = $1;
  `;
  
  try {
    const { rows } = await query(sql, [email]);
    return rows[0]; 
  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    throw new Error('Error en la base de datos');
  }
};

// --- ¡NUEVA FUNCIÓN! ---
/**
 * Obtiene todos los usuarios con su información de perfil.
 * (Para la tabla de 'Gestión de Usuarios' del Admin)
 */
/**
 * Obtiene todos los usuarios con su información de perfil.
 * Acepta filtros por rol, grupo y ordenamiento. (Versión Refactorizada)
 */
export const findAllUsuarios = async ({ filtroRol = 'todos', filtroGrupo = 'todos', orden = 'a-z' } = {}) => {
  let sqlBase = `
    SELECT 
      u.id_usuario, u.username, u.email, u.rol, u.activo,
      COALESCE(a.nombre, d.nombre, al.nombre) AS nombre,
      COALESCE(a.foto_perfil, d.foto_perfil, al.foto_perfil) AS foto_perfil,
      COALESCE(al.matricula, d.no_empleado, a.puesto) AS identificador,
      g.nombre AS grupo -- Nombre del grupo del alumno
    FROM 
      usuarios u
      LEFT JOIN admins a ON u.id_usuario = a.id_usuario AND u.rol = 'admin'
      LEFT JOIN docentes d ON u.id_usuario = d.id_usuario AND u.rol = 'docente'
      LEFT JOIN alumnos al ON u.id_usuario = al.id_usuario AND u.rol = 'alumno'
      LEFT JOIN grupos g ON al.id_grupo = g.id_grupo
  `;
  
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;
  let grupoNoEncontrado = false; // Bandera para grupo

  // 1. Añadir filtro por ROL
  if (filtroRol && filtroRol !== 'todos') {
    whereClauses.push(`u.rol = $${paramIndex}`);
    queryParams.push(filtroRol);
    paramIndex++;
  }

  // 2. Añadir filtro por GRUPO (Buscar ID primero)
  if (filtroGrupo && filtroGrupo !== 'todos') {
    if (!filtroRol || filtroRol === 'todos' || filtroRol === 'alumno') {
      try {
        const grupoRes = await query('SELECT id_grupo FROM grupos WHERE nombre = $1', [filtroGrupo]);
        if (grupoRes.rows.length > 0) {
          const idGrupoFiltrado = grupoRes.rows[0].id_grupo;
          whereClauses.push(`al.id_grupo = $${paramIndex}`);
          queryParams.push(idGrupoFiltrado);
          paramIndex++;
        } else {
          console.warn(`Filtro de grupo: '${filtroGrupo}' no encontrado.`);
          grupoNoEncontrado = true; // Marcamos que el grupo no existe
        }
      } catch (grupoError) {
         console.error("Error buscando ID de grupo para filtro:", grupoError);
         throw new Error("Error al procesar filtro de grupo.");
      }
    } else {
       console.warn("Filtro de grupo ignorado porque el rol no es 'alumno'.");
    }
  }

  // 3. Si el grupo buscado no existe, retornamos vacío AHORA
  if (grupoNoEncontrado) {
    return []; // Retorno legal aquí, antes del try principal
  }

  // 4. Construir la consulta FINAL
  let finalSql = sqlBase;
  if (whereClauses.length > 0) {
    finalSql += ' WHERE ' + whereClauses.join(' AND ');
  }

  // 5. Añadir ORDER BY
  if (orden === 'a-z') {
    finalSql += ' ORDER BY nombre ASC;';
  } else if (orden === 'z-a') {
    finalSql += ' ORDER BY nombre DESC;';
  } else {
    finalSql += ' ORDER BY u.rol, nombre ASC;'; // Orden por defecto
  }

  // 6. Ejecutar la consulta
  try {
    const { rows } = await query(finalSql, queryParams);
    return rows; // Este return ahora debería ser válido
  } catch (error) {
    console.error('Error al obtener todos los usuarios con filtros:', error);
    throw new Error('Error en la base de datos');
  }
}; // Fin de findAllUsuarios

export const create = async (userData) => {
  // Extraemos los datos del formulario
  const { 
    email, rol, nombre, foto_perfil, 
    matricula, id_grupo_nombre, id_carrera, // Alumno
    no_empleado, especialidad, id_departamento, // Docente
    puesto // Admin
  } = userData;

  let passwordPorDefecto;

  // 1. Asignar contraseña por defecto según el ROL
  if (rol === 'alumno') {
    if (!matricula) throw new Error('La matrícula es obligatoria para el alumno.');
    passwordPorDefecto = matricula;
  } else if (rol === 'docente') {
    if (!no_empleado) throw new Error('El No. de Empleado es obligatorio para el docente.');
    passwordPorDefecto = no_empleado;
  } else if (rol === 'admin') {
    passwordPorDefecto = 'unach123'; // Pwd temporal para nuevos admins
  } else {
    throw new Error('Rol no válido.');
  }

  // 2. Hashear la contraseña por defecto
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(passwordPorDefecto, salt);

  // 3. Definir la consulta para 'usuarios'
  const sqlUsuario = `
    INSERT INTO usuarios (username, email, password, rol) 
    VALUES ($1, $2, $3, $4)
    RETURNING id_usuario;
  `;
  const valuesUsuario = [email.split('@')[0], email, hashedPassword, rol];

  try {
    // 4. Iniciar la transacción
    await query('BEGIN');

    // 5. Ejecutar el primer INSERT (en 'usuarios')
    const { rows } = await query(sqlUsuario, valuesUsuario);
    const nuevoUsuarioId = rows[0].id_usuario;

    // 6. Ejecutar el segundo INSERT (en 'alumnos', 'docentes' o 'admins')
    
    // --- Lógica para buscar IDs a partir de nombres ---
    // (Esto soluciona el problema de 'id_grupo' que mencionamos)
    let id_grupo_encontrado = null;
    if (rol === 'alumno' && id_grupo_nombre) {
      const resGrupo = await query('SELECT id_grupo FROM grupos WHERE nombre = $1', [id_grupo_nombre]);
      if (resGrupo.rows[0]) {
        id_grupo_encontrado = resGrupo.rows[0].id_grupo;
      } else {
        // Opcional: ¿creamos el grupo si no existe? Por ahora solo lo omitimos.
        console.warn(`Advertencia: El grupo '${id_grupo_nombre}' no fue encontrado.`);
      }
    }
    
    // (Aquí iría la lógica para buscar id_carrera y id_departamento si vinieran como nombre)
    // Por ahora, asumimos que id_carrera y id_departamento son NULOS o ya vienen como IDs.

    let sqlPerfil;
    let valuesPerfil;

    if (rol === 'alumno') {
      sqlPerfil = `
        INSERT INTO alumnos (nombre, matricula, email, qr_code, id_usuario, id_grupo, id_carrera, foto_perfil)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `;
      valuesPerfil = [nombre, matricula, email, `qr_${matricula}`, nuevoUsuarioId, id_grupo_encontrado, id_carrera || null, foto_perfil || '/default-avatar.png'];
    
    } else if (rol === 'docente') {
      sqlPerfil = `
        INSERT INTO docentes (nombre, no_empleado, email, especialidad, id_departamento, qr_code, id_usuario, foto_perfil)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `;
      valuesPerfil = [nombre, no_empleado, email, especialidad || null, id_departamento || null, `qr_${no_empleado}`, nuevoUsuarioId, foto_perfil || '/default-avatar.png'];
    
    } else if (rol === 'admin') {
      sqlPerfil = `
        INSERT INTO admins (nombre, puesto, email, id_usuario, foto_perfil)
        VALUES ($1, $2, $3, $4, $5);
      `;
      valuesPerfil = [nombre, puesto || 'Administrador', email, nuevoUsuarioId, foto_perfil || '/default-avatar.png'];
    }

    await query(sqlPerfil, valuesPerfil);

    // 7. Si todo salió bien, confirmamos la transacción
    await query('COMMIT');
    return { id_usuario: nuevoUsuarioId };

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error en transacción de crear usuario:', error);
    if (error.code === '23505') { 
      throw new Error(`Error: Ya existe un usuario con ese email, matrícula o No. de empleado.`);
    }
    throw new Error(error.message || 'Error en la base de datos al crear el usuario.');
  }
};

export const remove = async (id_usuario) => {
  // 1. Verificamos que no sea el admin principal (ID 1)
  // ¡No queremos que el admin se borre a sí mismo!
  if (id_usuario === 1) {
    throw new Error('No se puede eliminar al administrador principal.');
  }

  // Esta línea es la CORRECTA
  const sql = 'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING email;';
  
  try {
    const { rows } = await query(sql, [id_usuario]);
    
    if (rows.length === 0) {
      throw new Error('No se encontró el usuario a eliminar.');
    }
    
    return rows[0]; // Devuelve el usuario que fue eliminado
  
  } catch (error) {
    console.error('Error en modelo remove:', error.message);
    throw error; // Lanza el error (ej. "No se puede eliminar al admin")
  }
};

// --- ¡NUEVA FUNCIÓN PARA ACTUALIZAR USUARIO! ---
/**
 * Actualiza la información de un usuario y su perfil asociado.
 * Nota: No actualiza la contraseña ni el rol por seguridad.
 */
export const update = async (id_usuario, userData) => {
  // Extraemos los datos del formulario
  const { 
    email, nombre, activo, // Campos comunes
    matricula, id_grupo_nombre, // Alumno
    no_empleado, especialidad, // Docente
    puesto // Admin
  } = userData;

  // 1. Obtenemos el ROL actual del usuario (para saber qué tabla de perfil actualizar)
  let rolActual;
  try {
    const userRole = await query('SELECT rol FROM usuarios WHERE id_usuario = $1', [id_usuario]);
    if (userRole.rows.length === 0) throw new Error('Usuario no encontrado');
    rolActual = userRole.rows[0].rol;
  } catch (error) {
    throw new Error('Error al verificar el rol del usuario.');
  }

  try {
    // 2. Iniciar la transacción
    await query('BEGIN');

    // 3. Actualizar la tabla 'usuarios'
    // (Solo actualizamos email, username y estado 'activo')
    const sqlUsuario = `
      UPDATE usuarios
      SET 
        email = $1,
        username = $2,
        activo = $3
      WHERE id_usuario = $4;
    `;
    // Asumimos 'activo' viene como 'on' o 'undefined'. (Lo ajustaremos en el controlador)
    await query(sqlUsuario, [
      email, 
      email.split('@')[0], 
      activo ? true : false, 
      id_usuario
    ]);

    // 4. Actualizar la tabla de PERFIL (alumnos, docentes, o admins)
    let sqlPerfil;
    let valuesPerfil;

    if (rolActual === 'alumno') {
      // Busca el ID del grupo (igual que en 'create')
      let id_grupo_encontrado = null;
      if (id_grupo_nombre) {
        const resGrupo = await query('SELECT id_grupo FROM grupos WHERE nombre = $1', [id_grupo_nombre]);
        if (resGrupo.rows[0]) id_grupo_encontrado = resGrupo.rows[0].id_grupo;
      }
      
      sqlPerfil = `
        UPDATE alumnos
        SET nombre = $1, email = $2, matricula = $3, id_grupo = $4
        WHERE id_usuario = $5;
      `;
      valuesPerfil = [nombre, email, matricula, id_grupo_encontrado, id_usuario];

    } else if (rolActual === 'docente') {
      sqlPerfil = `
        UPDATE docentes
        SET nombre = $1, email = $2, no_empleado = $3, especialidad = $4
        WHERE id_usuario = $5;
      `;
      valuesPerfil = [nombre, email, no_empleado, especialidad, id_usuario];

    } else if (rolActual === 'admin') {
      sqlPerfil = `
        UPDATE admins
        SET nombre = $1, email = $2, puesto = $3
        WHERE id_usuario = $5;
      `;
      valuesPerfil = [nombre, email, puesto, id_usuario];
    }

    // Ejecutamos la consulta del perfil
    await query(sqlPerfil, valuesPerfil);

    // 5. Si todo salió bien, confirmamos la transacción
    await query('COMMIT');
    return { id_usuario: id_usuario, nombre: nombre };

  } catch (error) {
    // 6. Si algo falló, revertimos
    await query('ROLLBACK');
    console.error('Error en transacción de actualizar usuario:', error);
    if (error.code === '23505') { 
      throw new Error(`Error: El email, matrícula o No. de empleado ya está en uso por otro usuario.`);
    }
    throw new Error(error.message || 'Error en la base de datos al actualizar el usuario.');
  }
};

/**
 * Genera y guarda un token de reseteo para un usuario por email.
 */
export const setResetToken = async (email) => {
  const user = await findUserByEmailWithProfile(email); // Reutilizamos esta función
  if (!user) {
    throw new Error('No existe un usuario con ese correo electrónico.');
  }

  // 1. Genera un token aleatorio
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // 2. Encripta el token antes de guardarlo (por seguridad)
  const hashedToken = await bcrypt.hash(resetToken, 10);
  
  // 3. Define la expiración (ej. 1 hora)
  const expires = new Date(Date.now() + 3600000); // 1 hora desde ahora

  // 4. Guarda en la BD
  const sql = `
    UPDATE usuarios 
    SET reset_token = $1, reset_token_expires = $2 
    WHERE email = $3
    RETURNING id_usuario;
  `;
  try {
    await query(sql, [hashedToken, expires, email]);
    return resetToken; // Devuelve el token SIN encriptar (para la simulación)
  } catch (error) {
    console.error("Error guardando reset token:", error);
    throw new Error('Error al guardar el token de reseteo.');
  }
};

/**
 * Resetea la contraseña usando un token válido.
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  // 1. Hashear el token que nos llega para buscarlo en la BD
  const hashedToken = await bcrypt.hash(token, 10);
  
  // 2. Buscar al usuario por el token y la fecha de expiración
  const sqlFind = `
    SELECT id_usuario FROM usuarios 
    WHERE reset_token = $1 AND reset_token_expires > NOW();
  `;
  let user;
  try {
    const { rows } = await query(sqlFind, [hashedToken]);
    if (rows.length === 0) {
      throw new Error('Token no válido o ha expirado.');
    }
    user = rows[0];
  } catch (error) {
    console.error("Error buscando usuario por token:", error);
    throw error;
  }

  // 3. Hashear la nueva contraseña
  const salt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);

  // 4. Actualizar la contraseña y limpiar el token
  const sqlUpdate = `
    UPDATE usuarios 
    SET password = $1, reset_token = NULL, reset_token_expires = NULL 
    WHERE id_usuario = $2
    RETURNING id_usuario;
  `;
  try {
    await query(sqlUpdate, [newHashedPassword, user.id_usuario]);
    return true; // Éxito
  } catch (error) {
     console.error("Error al resetear contraseña:", error);
     throw new Error('Error al actualizar la contraseña.');
  }
};