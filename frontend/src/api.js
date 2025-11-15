import axios from 'axios';

// 1. Creamos la instancia de Axios
const api = axios.create({
  // URL base de tu backend
  baseURL: 'http://localhost:5000/api' 
});

// 2. Creamos el "Interceptor" (el guardia de peticiones)
// Esto se ejecutará ANTES de que cualquier petición sea enviada
api.interceptors.request.use(
  (config) => {
    // 3. Obtenemos el token del localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // 4. Si el token existe, lo añadimos al header 'x-auth-token'
      // (Este es el header que nuestro middleware 'protegerRuta' está buscando)
      config.headers['x-auth-token'] = token;
    }
    return config; // Dejamos que la petición continúe
  },
  (error) => {
    // Si hay un error al configurar la petición, lo rechazamos
    return Promise.reject(error);
  }
);

export default api;