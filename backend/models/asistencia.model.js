import { query } from '../config/database.js';

/*
 * Modelo para OBTENER las asistencias registradas HOY
 * (Combina alumnos y docentes)
 */
export const findToday = async () => {
  const sql = `
    -- Asistencias de Alumnos
    SELECT 
      a.id_asistencia,
      'alumno' AS tipo,
      al.nombre AS nombre_persona,
      al.matricula AS identificador,
      al.email,
      g.nombre AS grupo_tipo, -- Usamos un alias consistente
      m.nombre AS nombre_materia,
      l.nombre AS nombre_laboratorio,
      a.hora_ingreso,
      al.foto_perfil,
      a.estado -- Estado de la asistencia (presente, tardanza)
    FROM 
      asistencias a
      JOIN clases cl ON a.id_clase = cl.id_clase
      JOIN alumnos al ON a.id_alumno = al.id_alumno
      LEFT JOIN grupos g ON al.id_grupo = g.id_grupo
      JOIN horarios_materias hm ON cl.id_horario = hm.id_horario
      JOIN materias m ON hm.id_materia = m.id_materia
      JOIN laboratorios l ON cl.id_laboratorio = l.id_laboratorio
    WHERE 
      DATE(a.hora_ingreso) = CURRENT_DATE -- Filtra por hoy

    UNION ALL -- Une con las asistencias de docentes

    -- Asistencias de Docentes
    SELECT 
      ad.id_asistencia_docente AS id_asistencia,
      'docente' AS tipo,
      d.nombre AS nombre_persona,
      d.no_empleado AS identificador,
      d.email,
      'Docente' AS grupo_tipo, -- Placeholder para docentes
      m.nombre AS nombre_materia,
      l.nombre AS nombre_laboratorio,
      ad.hora_ingreso,
      d.foto_perfil,
      'presente' AS estado -- Asumimos que los docentes siempre están 'presente'
    FROM 
      asistencias_docentes ad
      JOIN clases cl ON ad.id_clase = cl.id_clase
      JOIN docentes d ON ad.id_docente = d.id_docente
      JOIN horarios_materias hm ON cl.id_horario = hm.id_horario
      JOIN materias m ON hm.id_materia = m.id_materia
      JOIN laboratorios l ON cl.id_laboratorio = l.id_laboratorio
    WHERE 
      DATE(ad.hora_ingreso) = CURRENT_DATE -- Filtra por hoy

    ORDER BY 
      hora_ingreso DESC; -- Muestra los más recientes primero
  `;
  try {
    const { rows } = await query(sql);
    return rows;
  } catch (error) {
    console.error('Error en modelo findToday asistencias:', error.message);
    throw new Error('Error en la base de datos');
  }
};

// (Más adelante añadiremos la función 'create' para registrar asistencia desde el QR)
// ... (import query) ...
// ... (función findToday) ...

// --- ¡NUEVA FUNCIÓN PARA REGISTRAR ASISTENCIA! ---
/**
 * Registra la asistencia de un alumno o docente basado en su QR code.
 * Verifica si hay una clase activa en ese momento.
 */


/**
 * Registra la asistencia de un alumno o docente basado en su QR code.
 * Verifica si hay una clase activa en ese momento. (Versión Corregida)
 */
export const create = async (qrCode) => {
  let tipoUsuario;
  let idUsuario; // Este será id_alumno o id_docente
  let perfilData; // Guardaremos los datos del perfil aquí

  // 1. Buscar directamente por QR Code en ambas tablas
  try {
    // Busca en alumnos
    let queryUsuario = `
      SELECT 
        al.id_alumno, al.id_usuario, al.nombre, al.foto_perfil, al.matricula, 
        g.nombre AS nombre_grupo 
      FROM alumnos al 
      LEFT JOIN grupos g ON al.id_grupo = g.id_grupo 
      WHERE al.qr_code = $1 AND al.activo = TRUE`;
    let res = await query(queryUsuario, [qrCode]);

    if (res.rows.length > 0) {
      tipoUsuario = 'alumno';
      perfilData = res.rows[0];
      idUsuario = perfilData.id_alumno; 
    } else {
      // Si no es alumno, busca en docentes
      queryUsuario = `
        SELECT 
          id_docente, id_usuario, nombre, foto_perfil, no_empleado 
        FROM docentes 
        WHERE qr_code = $1 AND activo = TRUE`;
      res = await query(queryUsuario, [qrCode]);

      if (res.rows.length > 0) {
        tipoUsuario = 'docente';
        perfilData = res.rows[0];
        idUsuario = perfilData.id_docente; 
      } else {
        // Si no se encuentra en ninguna tabla
        throw new Error('QR Code no encontrado o usuario inactivo.'); 
      }
    }
  } catch (dbError) {
     console.error("Error buscando usuario por QR:", dbError);
     // Lanza el error original si es el de "no encontrado", o uno genérico
     throw dbError.message.includes('QR Code no encontrado') ? dbError : new Error("Error al buscar usuario en la base de datos.");
  }

  // 2. Buscar una clase activa AHORA MISMO
  const ahora = new Date();
  // Ajusta la hora actual a CST (GMT-6), considera horario de verano si aplica
  // IMPORTANTE: Esto asume que tu servidor corre en UTC o necesita ajuste manual.
  // Si tu servidor YA está en CST, puedes usar ahora directamente.
  // Para GMT-6 (CST estándar):
  // const ahoraCST = new Date(ahora.getTime() - 6 * 60 * 60 * 1000); 
  // const horaActual = ahoraCST.toTimeString().split(' ')[0].substring(0, 8); // HH:MM:SS
  // const fechaActual = ahoraCST.toISOString().split('T')[0]; // YYYY-MM-DD

  // Usaremos la hora local del servidor por simplicidad ahora:
  const horaActual = ahora.toTimeString().split(' ')[0].substring(0, 8); // HH:MM:SS
  const fechaActual = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`Buscando clase activa para Fecha: ${fechaActual}, Hora: ${horaActual}`); // Log para debug

  // Buscamos clase programada HOY, entre hora_inicio y hora_fin
  const queryClaseActiva = `
      SELECT id_clase, hora_inicio 
      FROM clases 
      WHERE fecha = $1 
        AND hora_inicio <= $2 
        AND hora_fin >= $2
        AND estado IN ('programada', 'en_curso')
      LIMIT 1; -- Tomamos solo una si hay superposición
  `; 

  const resClase = await query(queryClaseActiva, [fechaActual, horaActual]);

  if (resClase.rows.length === 0) {
    console.log(`No se encontró clase activa para ${fechaActual} ${horaActual}`); // Log para debug
    throw new Error('No hay ninguna clase activa programada para este momento.');
  }

  const claseActiva = resClase.rows[0];
  const idClaseActiva = claseActiva.id_clase;
  console.log(`Clase activa encontrada: ID ${idClaseActiva}`); // Log para debug

  // 3. Determinar el estado (presente o tardanza)
  const horaInicioClase = claseActiva.hora_inicio;
  const minutosInicio = horaInicioClase.split(':').reduce((acc, val, i) => acc + parseInt(val) * (i === 0 ? 60 : 1), 0);
  const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();

  // Tolerancia de 10 minutos (ajustable)
  const estadoAsistencia = (minutosActual <= minutosInicio + 10) ? 'presente' : 'tardanza';
  console.log(`Estado calculado: ${estadoAsistencia}`); // Log para debug

  // 4. Insertar la asistencia
  let sqlInsert;
  let valuesInsert;
  let resultadoInsert;
  try {
    if (tipoUsuario === 'alumno') {
       sqlInsert = `INSERT INTO asistencias (id_clase, id_alumno, estado, metodo_registro) VALUES ($1, $2, $3, 'qr') ON CONFLICT (id_clase, id_alumno) DO NOTHING RETURNING id_asistencia, hora_ingreso;`;
       valuesInsert = [idClaseActiva, idUsuario, estadoAsistencia];
       resultadoInsert = await query(sqlInsert, valuesInsert);
    } else { // docente
       sqlInsert = `INSERT INTO asistencias_docentes (id_clase, id_docente, metodo_registro) VALUES ($1, $2, 'qr') ON CONFLICT (id_clase, id_docente) DO NOTHING RETURNING id_asistencia_docente, hora_ingreso;`;
       valuesInsert = [idClaseActiva, idUsuario];
       resultadoInsert = await query(sqlInsert, valuesInsert);
    }

    // 5. Devolver información útil al frontend
    if (resultadoInsert.rows.length === 0) {
      console.log(`Usuario ${perfilData.nombre} ya había registrado asistencia para clase ${idClaseActiva}.`); // Log
      return { msg: 'Ya se había registrado la asistencia.', yaRegistrado: true };
    } else {
      console.log(`Asistencia registrada para ${perfilData.nombre}.`); // Log
      return { 
        nombre: perfilData.nombre,
        foto_perfil: perfilData.foto_perfil,
        rol: tipoUsuario,
        identificador: tipoUsuario === 'alumno' ? perfilData.matricula : perfilData.no_empleado,
        // Usa el nombre del grupo que ya obtuvimos en perfilData
        grupo: tipoUsuario === 'alumno' ? perfilData.nombre_grupo : null, 
        hora_ingreso: resultadoInsert.rows[0].hora_ingreso,
        estado: tipoUsuario === 'alumno' ? estadoAsistencia : 'presente', 
        yaRegistrado: false
      };
    }

  } catch (insertError) {
     console.error(`Error al insertar asistencia para ${tipoUsuario} (${perfilData.nombre}):`, insertError); // Log más detallado
     if (insertError.code === '23503') { // Error de Foreign Key
        throw new Error('Error de referencia: La clase o el usuario parecen no existir (FK).');
     }
     throw new Error('Error en la base de datos al registrar la asistencia.');
  }
}; // Fin de la función create

/**
 * Busca la (primera) clase activa en CUALQUIER laboratorio
 * (Para la pantalla de registro pública)
 */
export const findClaseActivaGeneral = async () => {
  const ahora = new Date();
  // Ajusta la hora a CST (GMT-6) si tu servidor está en otra zona horaria
  // const ahoraCST = new Date(ahora.getTime() - 6 * 60 * 60 * 1000); 
  // const horaActual = ahoraCST.toTimeString().split(' ')[0].substring(0, 8);
  // const fechaActual = ahoraCST.toISOString().split('T')[0];
  
  // Usando hora local del servidor por ahora:
  const horaActual = ahora.toTimeString().split(' ')[0].substring(0, 8);
  const fechaActual = ahora.toISOString().split('T')[0];

  const sql = `
    SELECT 
      c.id_clase, c.fecha, c.hora_inicio, c.hora_fin,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      g.nombre AS nombre_grupo,
      l.nombre AS nombre_laboratorio,
      -- Cuenta el total de alumnos inscritos en ese grupo
      (SELECT COUNT(*) FROM alumnos al WHERE al.id_grupo = g.id_grupo AND al.activo = TRUE) AS total_alumnos_grupo
    FROM clases c
    JOIN horarios_materias hm ON c.id_horario = hm.id_horario
    JOIN materias m ON hm.id_materia = m.id_materia
    JOIN docentes d ON hm.id_docente = d.id_docente
    JOIN grupos g ON hm.id_grupo = g.id_grupo
    JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    WHERE c.fecha = $1 
      AND c.hora_inicio <= $2 
      AND c.hora_fin >= $2
      AND c.estado IN ('programada', 'en_curso')
    ORDER BY c.id_clase -- Ordena para tomar una de forma consistente
    LIMIT 1; -- Solo devuelve la primera clase activa que encuentre
  `;
  try {
    const { rows } = await query(sql, [fechaActual, horaActual]);
    if (rows.length === 0) {
        return null; // No hay clase activa
    }
    return rows[0]; // Devuelve la primera encontrada
  } catch (error) {
    console.error("Error en modelo findClaseActivaGeneral:", error.message);
    throw new Error('Error al buscar clase activa.');
  }
};

export const findAsistenciaDataForPdf = async (id_clase) => {
  let claseInfo, asistencias;

  // 1. Obtener información de la clase
  const claseSql = `
    SELECT 
      c.id_clase, c.fecha, c.hora_inicio, c.hora_fin,
      m.nombre AS nombre_materia,
      d.nombre AS nombre_docente,
      g.nombre AS nombre_grupo,
      l.nombre AS nombre_laboratorio
    FROM clases c
    JOIN horarios_materias hm ON c.id_horario = hm.id_horario
    JOIN materias m ON hm.id_materia = m.id_materia
    JOIN docentes d ON hm.id_docente = d.id_docente
    JOIN grupos g ON hm.id_grupo = g.id_grupo
    JOIN laboratorios l ON c.id_laboratorio = l.id_laboratorio
    WHERE c.id_clase = $1;
  `;
  try {
    const { rows } = await query(claseSql, [id_clase]);
    if (rows.length === 0) throw new Error('Clase no encontrada.');
    claseInfo = rows[0];
  } catch (error) {
    console.error("Error en findAsistenciaDataForPdf (Info Clase):", error.message);
    throw error;
  }

  // 2. Obtener lista de asistencias de alumnos
  const asistenciasSql = `
    SELECT 
      al.nombre AS nombre_alumno,
      al.matricula,
      a.hora_ingreso,
      a.estado
    FROM asistencias a
    JOIN alumnos al ON a.id_alumno = al.id_alumno
    WHERE a.id_clase = $1
    ORDER BY al.nombre ASC;
  `;
  try {
    const { rows } = await query(asistenciasSql, [id_clase]);
    asistencias = rows;
  } catch (error) {
    console.error("Error en findAsistenciaDataForPdf (Lista Asistencias):", error.message);
    throw new Error('Error al obtener la lista de asistencias.');
  }

  return { claseInfo, asistencias };
};