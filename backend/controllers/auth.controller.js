import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmailWithProfile } from '../models/usuario.model.js';
import 'dotenv/config';

export const login = async (req, res) => {
  const { email, password } = req.body;

 
  // 1. Validar entradas
  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese email y contraseña' });
  }

  try {
    // 2. Buscar al usuario en la BD (Modelo)
    const user = await findUserByEmailWithProfile(email);
    console.log('--- RESULTADO DE LA BASE DE DATOS ---');
    console.log('Usuario encontrado:', user);

    if (!user) {
      return res.status(401).json({ msg: 'Credenciales incorrectas (Email no encontrado)' });
    }

    // 3. Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(403).json({ msg: 'Usuario inactivo. Contacte al administrador.' });
    }

    // 4. Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Credenciales incorrectas (Contraseña incorrecta)' });
    }

    // 5. Crear el Payload para el Token (JWT)
    const payload = {
      usuario: {
        id: user.id_usuario,
        rol: user.rol,
        email: user.email,
        nombre: user.nombre_perfil
      }
    };

    // 6. Firmar el Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }, // El token expira en 8 horas
      (err, token) => {
        if (err) throw err;
        
        // 7. Enviar respuesta exitosa con el token y los datos del usuario
        res.status(200).json({
          token,
          usuario: {
            id: user.id_usuario,
            rol: user.rol,
            nombre: user.nombre_perfil,
            email: user.email,
            foto: user.foto_perfil
          }
        });
      }
    );

  } catch (error) {
    console.error('Error en el controlador de login:', error.message);
    res.status(500).send('Error del servidor');
  }
};