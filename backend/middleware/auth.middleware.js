import jwt from 'jsonwebtoken';
import 'dotenv/config';

// 1. Guardia principal: Revisa si el token es válido
export const protegerRuta = (req, res, next) => {
  // Obtenemos el token del header
  const token = req.header('x-auth-token');

  // Si no hay token, no hay acceso
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  try {
    // Verificamos el token (el "holograma")
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Si es válido, guardamos los datos del usuario en el 'req'
    req.usuario = payload.usuario; 
    next(); // <--- Pasa al siguiente middleware o al controlador
  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};

// 2. Guardia específico: Revisa si el usuario es Admin
export const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
  next();
};

// 3. Guardia específico: Revisa si el usuario es Docente
export const esDocente = (req, res, next) => {
  if (req.usuario.rol !== 'docente') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Docente.' });
  }
  next();
};

// ... (protegerRuta, esAdmin, esDocente) ...

// 4. Guardia específico: Revisa si el usuario es Alumno
export const esAlumno = (req, res, next) => {
  if (req.usuario.rol !== 'alumno') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Alumno.' });
  }
  next();
};