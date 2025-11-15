import bcrypt from 'bcryptjs';

// La contraseña que SÍ queremos usar
const password = 'admin';

// Generamos el hash
try {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  console.log('¡Nuevo hash generado con éxito!');
  console.log('===================================');
  console.log(hash);
  console.log('===================================');
  console.log('Copia el hash de arriba y ejecútalo en pgAdmin.');

} catch (e) {
  console.error('Error al generar el hash:', e);
}