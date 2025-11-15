import React, { useState } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardDocente from './components/DashboardDocente';
import DashboardAlumno from './components/DashboardAlumno';
import PantallaRegistroClase from './components/PantallaRegistroClase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (loginData) => {
    setLoading(true);
    const { email, password } = loginData;

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, usuario: backendUser } = response.data;
      localStorage.setItem('token', token);

      const userData = {
        type: backendUser.rol.charAt(0).toUpperCase() + backendUser.rol.slice(1),
        email: backendUser.email,
        name: backendUser.nombre,
        username: backendUser.email.split('@')[0],
        foto_perfil: backendUser.foto,
        rol: backendUser.rol,
        info: { id_usuario: backendUser.id },
        permisos: []
      };

      setUser(userData);
    } catch (err) {
      console.error('Error en el login:', err);
      alert(err.response?.data?.msg || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.rol) {
      case 'admin':
        return <DashboardAdmin userData={user} onLogout={handleLogout} />;
      case 'docente':
        return <DashboardDocente userData={user} onLogout={handleLogout} />;
      case 'alumno':
        return <DashboardAlumno userData={user} onLogout={handleLogout} />;
      default:
        return <div>Error: Rol no reconocido</div>;
    }
  };

  return (
    <div className="App"> 
      <Routes>
        {/* Pantalla principal */}
        <Route
          path="/"
          element={
            !user ? (
              <div className="login-fullscreen"> 
                <Login onLogin={handleLogin} loading={loading} />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      const nuevaVentana = window.open(
                        '/pantalla-registro',
                        '_blank',
                        'width=1200,height=800'
                      );
                      if (!nuevaVentana) {
                        alert('Por favor, permite las ventanas emergentes para usar esta función.');
                      }
                    }}
                    className="btn-modoregistro"
                  >
                    🖥️ Pantalla de Registro
                  </button>
                </div>
              </div>
            ) : (
              renderDashboard()
            )
          }
        />

        {/* Pantalla de registro separada */}
        <Route
          path="/pantalla-registro"
          element={<PantallaRegistroClase esPantallaPrincipal={true} />}
        />
      </Routes>
    </div>
  );
}

export default App;