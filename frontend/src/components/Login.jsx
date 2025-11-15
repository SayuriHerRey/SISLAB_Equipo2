import React, { useState } from 'react';
import '../Login.css';

const Login = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  // Datos de prueba para mostrar en la interfaz
  const credencialesPrueba = [
    { rol: 'Administrador', email: 'admin@unach.mx', password: '1234' },
    { rol: 'Docente', email: 'docente@unach.mx', password: '1234' },
    { rol: 'Alumno', email: 'alumno@unach.mx', password: '1234' }
  ];

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Panel izquierdo con información del sistema */}
        <div className="login-info-panel">
          <div className="logo-section">
            <div className="logo-image-container">
              <img 
                src="..\logoSISLAB.png" 
                alt="SISLAB - UNACH" 
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-fallback">
                <span>SISLAB</span>
              </div>
            </div>
            <h1 className="unach-title">Universidad Autónoma de Chiapas</h1>
            <h1 className="system-name">Sistema de Gestión de Laboratorios de Computo</h1>
          </div>
          
          <div className="system-info">
            <div className="welcome-message">
              <h2>¡Bienvenido a SISLAB!</h2>
              <p className="system-description">
                Plataforma unificada para la administración y uso eficiente de los laboratorios de cómputo.
                Simplifica procesos, mejora la organización y fortalece el aprendizaje en nuestra institucion.
              </p>
            </div>
          </div>
        </div>
        
        {/* Panel derecho con formulario de login */}
        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h2 className="form-title">Iniciar Sesión</h2>
              <p className="form-subtitle">Ingresa tus datos institucionales para iniciar sesión</p>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="input-label">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@unach.mx"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="input-label">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  required
                />
              </div>
              
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Iniciando sesión...
                  </>
                ) : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;