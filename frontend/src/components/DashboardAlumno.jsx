import React, { useState, useEffect, useCallback } from 'react';
import '../App.css'; // Asumiendo estilos compartidos
import api from '../api.js'; // Cliente API
import { QRCodeSVG } from 'qrcode.react'; // Generador QR
import { useNavigate } from 'react-router-dom'; // Para logout

const DashboardAlumno = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  // --- Estados para Datos del Backend ---
  const [activeMenu, setActiveMenu] = useState('qr');
  const [perfil, setPerfil] = useState(null);
  const [horarios, setHorarios] = useState([]); // Clases de la semana
  const [asistencias, setAsistencias] = useState([]); // Historial de asistencias
  const [metricas, setMetricas] = useState({
    clasesEstaSemana: 0,
    asistenciasTotales: 0,
    porcentajeAsistencia: 0,
    totalMaterias: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (Estados Editar Perfil - usan mocks por ahora)
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(userData?.foto_perfil || '/default-avatar.png');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
// --- ¡NUEVO ESTADO PARA EL ARCHIVO DE FOTO! ---
  const [selectedFile, setSelectedFile] = useState(null); 
// ---------------------------------------------
  // --- Carga de Datos ---
  const cargarDatosAlumno = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [perfilRes, clasesSemanaRes, metricasRes, asistenciasRes] = await Promise.all([
        api.get('/alumnos/mi-perfil'),
        api.get('/alumnos/mis-clases?fecha=semana'), // Carga horario semanal
        api.get('/alumnos/mis-metricas'),
        api.get('/alumnos/mis-asistencias')
      ]);

      setPerfil(perfilRes.data);
      setHorarios(clasesSemanaRes.data);
      setMetricas(metricasRes.data);
      setAsistencias(asistenciasRes.data);

      if (perfilRes.data.foto_perfil) {
        setFotoPerfil(perfilRes.data.foto_perfil);
      }

    } catch (err) {
      console.error("Error al cargar datos del alumno:", err);
      setError("Error al cargar los datos. Intenta recargar.");
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
         alert("Tu sesión ha expirado.");
         onLogout();
         navigate('/login', { replace: true });
      }
    }
    setLoading(false);
  }, [onLogout, navigate]);

  useEffect(() => {
    cargarDatosAlumno();
  }, [cargarDatosAlumno]);

  // --- Helper Clases de Hoy ---
  const getClasesHoy = () => {
     const hoy = new Date().toISOString().split('T')[0];
     return horarios.filter(clase => {
        const fechaClase = new Date(clase.fecha).toISOString().split('T')[0];
        return fechaClase === hoy;
     });
  };
  const clasesHoy = getClasesHoy();

  // --- Funciones Mock (Editar Perfil) ---
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Guarda el ARCHIVO
      setSelectedFile(file); 
      
      // Muestra previsualización
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPerfil(event.target.result); 
      };
      reader.readAsDataURL(file);
    } else {
        setSelectedFile(null); 
    }
  };
  // --- FUNCIÓN guardarPerfil (FOTO - conectada) ---
  const guardarPerfil = async () => {
    if (!selectedFile) {
      setMensaje('⚠️ No has seleccionado una nueva foto.');
      return;
    }

    setLoading(true); 
    setMensaje('');
    setError(null);

    const formData = new FormData();
    formData.append('fotoPerfil', selectedFile); 

    try {
      // Llama al endpoint de ALUMNOS
      const response = await api.put('/alumnos/mi-perfil/foto', formData);

      // Éxito
      setLoading(false);
      const nuevaRutaFoto = response.data.foto_perfil;
      // Actualiza estado 'perfil' local si existe
      if(perfil) {
          setPerfil(prev => ({...prev, foto_perfil: nuevaRutaFoto}));
      }
      setMensaje(`✅ ${response.data.msg || 'Foto actualizada.'}`);
      setSelectedFile(null); 
      setTimeout(() => setMensaje(''), 5000);

    } catch (err) {
      // Error
      setLoading(false);
      console.error("Error al guardar foto (alumno):", err);
      if (err.response?.data?.msg) { 
        setMensaje(`❌ Error: ${err.response.data.msg}`); 
      } else {
        setMensaje("❌ Error de conexión al guardar foto.");
      }
    }
  };
  // ---------------------------------------
  const cambiarContraseña = async () => {
    // Validaciones
    if (nuevaPassword !== confirmarPassword) {
      setMensaje('❌ Las contraseñas no coinciden');
      return;
    }
    if (nuevaPassword.length < 6) {
      setMensaje('❌ La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!passwordActual) {
        setMensaje('❌ Debes ingresar tu contraseña actual.');
        return;
    }

    setLoading(true); 
    setMensaje(''); 
    setError(null); 

    try {
      // Llama al endpoint de ALUMNOS
      const response = await api.put('/alumnos/mi-perfil/password', {
        passwordActual: passwordActual,
        nuevaPassword: nuevaPassword 
      });

      // Éxito
      setLoading(false);
      setMensaje(`✅ ${response.data.msg || 'Contraseña cambiada.'}`);
      setCambiarPassword(false); 
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setMensaje(''), 5000); 

    } catch (err) {
      // Error
      setLoading(false);
      console.error("Error al cambiar contraseña (alumno):", err);
      if (err.response?.data?.msg) { 
        setMensaje(`❌ Error: ${err.response.data.msg}`); 
      } else {
        setMensaje("❌ Error de conexión.");
      }
    }
  };
  // ----------------------------------------------------

  // --- Funciones Render ---

  const renderQR = () => (
    <div className="qr-section">
      <h2>Mi QR de Asistencia</h2>
      {loading && !perfil ? <div className="loading">Cargando QR...</div> : perfil ? (
        <div className="alumno-info-card">
          <div className="alumno-header">
            <h3>{perfil.nombre}</h3>
            <p className="matricula">Matrícula: {perfil.matricula}</p>
            <p className="grupo">Grupo: {perfil.nombre_grupo || 'No asignado'}</p>
          </div>
          <div className="qr-content">
            <div className="qr-container">
              <h4>Mi Código QR</h4>
              <div className="qr-code">
                <QRCodeSVG value={perfil.qr_code} size={200} level="H" includeMargin={true} className="qr-code-image"/>
              </div>
              <p className="qr-instructions">
                Muestra este QR al ingresar al laboratorio para registrar tu asistencia
              </p>
              {clasesHoy.length > 0 ? (
                <div className="clases-hoy-info">
                  <h4>📅 Clases de Hoy:</h4>
                  {clasesHoy.map((clase, index) => (
                    <div key={index} className="clase-info">
                      <strong>{clase.nombre_materia}</strong>
                      <p>🕒 {`${clase.hora_inicio.substring(0,5)} - ${clase.hora_fin.substring(0,5)}`}</p>
                      <p>🏢 {clase.nombre_laboratorio}</p>
                      <p>👨‍🏫 {clase.nombre_docente}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-clases-info"><p>📭 No tienes clases programadas para hoy</p></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="error-message">{error || 'No se pudo cargar el código QR.'}</p>
      )}
    </div>
  );

  const renderHorarios = () => (
    <div className="horarios-section">
      <div className="section-header">
        <h2>Mis Horarios (Semana Actual)</h2>
        <button className="btn-refresh" onClick={cargarDatosAlumno} disabled={loading}>
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>
      </div>
      {loading ? ( <div className="loading">Cargando horarios...</div> )
       : error ? ( <div className="error-message">{error}</div> )
       : horarios.length === 0 ? ( <div className="no-data">No tienes horarios asignados para esta semana.</div> )
       : (
        <div className="horarios-grid">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(diaNombre => {
            // Usa la propiedad 'dia' que añadimos en el backend
            const clasesDelDia = horarios.filter(clase => clase.dia === diaNombre);
            return (
              <div key={diaNombre} className="horario-card">
                <h3>{diaNombre}</h3>
                {clasesDelDia.length === 0 ? (
                  <p className="no-clases">No hay clases este día</p>
                ) : (
                  clasesDelDia.map((clase) => (
                    <div key={clase.id_clase} className="clase-item">
                      <strong>{clase.nombre_materia}</strong>
                      <span>🕒 {`${clase.hora_inicio.substring(0,5)} - ${clase.hora_fin.substring(0,5)}`}</span>
                      <span>🏢 {clase.nombre_laboratorio}</span>
                      <span>👨‍🏫 {clase.nombre_docente}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

// --- Render Editar Perfil ---
  const renderEditarPerfil = () => (
    <div className="editar-perfil-section"> {/* Asegúrate que esta clase CSS exista y funcione */}
      <div className="section-header">
        <h2>Editar Perfil</h2>
        <button 
          className="btn-volver"
          onClick={() => {
             setMostrarEditarPerfil(false); 
             setCambiarPassword(false); // Cierra form de contraseña si estaba abierto
             setMensaje(''); // Limpia mensajes
          }}
        >
          ← Volver al Perfil
        </button>
      </div>

      {/* Muestra mensajes de éxito/error */}
      {mensaje && (
        <div className={`mensaje ${mensaje.includes('✅') ? 'mensaje-exito' : 'mensaje-error'}`}>
          {mensaje}
        </div>
      )}

      <div className="perfil-form"> {/* Contenedor principal del formulario */}
        
        {/* Sección Cambiar Foto */}
        <div className="foto-perfil-section">
          <h3>Foto de Perfil</h3>
          <div className="foto-container">
            <div className="foto-preview">
               <img
             // Añade la URL base del backend si la ruta no empieza con http
             src={
               (fotoPerfil || perfil.foto_perfil)?.startsWith('http') || !(fotoPerfil || perfil.foto_perfil)
               ? (fotoPerfil || perfil.foto_perfil || '/default-avatar.png')
               : `http://localhost:5000${fotoPerfil || perfil.foto_perfil}` // <-- Añade URL base
             }
             alt="Foto de perfil"
             className="foto-perfil-grande"
           />
            </div>
            <div className="foto-actions">
              <input
                type="file"
                id="foto-input-alumno" // ID único
                accept="image/*"
                onChange={handleFotoChange}
                className="file-input" // Reutiliza clase si existe
                style={{ display: 'none' }} // Oculta el input feo
              />
              <label htmlFor="foto-input-alumno" className="btn-subir-foto"> {/* Botón estilizado */}
                📷 Cambiar Foto
              </label>
              <button 
                onClick={guardarPerfil} 
                className="btn-guardar"
                disabled={!selectedFile || loading} 
              >
               {loading && selectedFile ? 'Guardando...' : '💾 Guardar Foto'}
              </button>
            </div>
          </div>
        </div>

        {/* Sección Cambiar Contraseña */}
        <div className="password-section">
          <h3>Seguridad</h3>
          {!cambiarPassword ? (
            <button 
              className="btn-cambiar-password"
              onClick={() => { setCambiarPassword(true); setMensaje(''); }}
            >
              🔒 Cambiar Contraseña
            </button>
          ) : (
            <div className="cambiar-password-form">
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required 
                />
              </div>
              <div className="password-actions">
                <button 
                  onClick={cambiarContraseña} 
                  className="btn-confirmar"
                  disabled={loading || !passwordActual || !nuevaPassword || !confirmarPassword}
                >
                  {loading ? 'Cambiando...' : '✅ Confirmar Cambio'}
                </button>
                <button 
                  onClick={() => {
                    setCambiarPassword(false);
                    setPasswordActual('');
                    setNuevaPassword('');
                    setConfirmarPassword('');
                    setMensaje(''); 
                  }}
                  className="btn-cancelar"
                  disabled={loading}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div> {/* Fin de perfil-form */}
    </div>
  );
  // -------------------------
  const renderPerfil = () => {
    if (mostrarEditarPerfil) {
      return renderEditarPerfil();
    }
    return (
     <div className="perfil-section">
       <div className="section-header">
         <h2>Mi Perfil</h2>
         <button className="btn-editar-perfil" onClick={() => setMostrarEditarPerfil(true)}>✏️ Editar Perfil</button>
       </div>
  {loading && !perfil ? <div className="loading">Cargando perfil...</div> : perfil ? (
     <div className="perfil-card">
        <div className="perfil-header">
           {/* ¡MODIFICA EL SRC AQUÍ! */}
            <img
             // Añade la URL base del backend si la ruta no empieza con http
             src={
               (fotoPerfil || perfil.foto_perfil)?.startsWith('http') || !(fotoPerfil || perfil.foto_perfil)
               ? (fotoPerfil || perfil.foto_perfil || '/default-avatar.png')
               : `http://localhost:5000${fotoPerfil || perfil.foto_perfil}` // <-- Añade URL base
  }
  alt="Foto de perfil" 
             className="foto-perfil-grande"
           />
                <div className="perfil-info">
                   <h3>{perfil.nombre}</h3>
                   <p className="matricula">Matrícula: {perfil.matricula}</p>
                   <p className="email">Email: {perfil.email}</p>
                   <p className="carrera">{perfil.nombre_carrera || 'N/A'}</p>
                   <p className="grupo">Grupo: {perfil.nombre_grupo || 'N/A'}</p>
                </div>
             </div>
             <div className="perfil-details">
                <div className="detail-group">
                   <h4>Información Académica</h4>
                   <p><strong>Usuario:</strong> {userData?.email || perfil.email}</p>
                   <p><strong>Materias Inscritas:</strong> {metricas.totalMaterias}</p>
                   <p><strong>Clases Esta Semana:</strong> {metricas.clasesEstaSemana}</p>
                   <p><strong>Asistencias Registradas:</strong> {metricas.asistenciasTotales}</p>
                </div>
                {/* Podríamos añadir más info si la tuviéramos */}
             </div>
          </div>
       ) : (
          <p className="error-message">{error || 'No se pudo cargar el perfil.'}</p>
       )}
    </div>
   )};

  const renderContent = () => {
    // ... (Tu lógica de loading/error) ...
    if (loading && !perfil) return <div className="loading">Cargando...</div>;
    if (error && !perfil) return <div className="error-message">{error}</div>;

    switch(activeMenu) {
      case 'qr': return renderQR();
      case 'horarios': return renderHorarios();
      case 'perfil': return renderPerfil();
      default: return renderQR();
    }
  };

   const ejecutarLogoutYRedirigir = () => {
  onLogout(); 
  navigate('/', { replace: true }); // Cambia '/login' por '/'
};

  // --- RETURN Principal (JSX) ---
  return (
    <div className="dashboard-alumno">
      <header className="alumno-header">
        <div className="header-left">
           <div className="logo"><span>UNACH</span></div>
           <h1>Panel del Alumno - SISLAB</h1>
         </div>
         {/* ... (Header con email y botón logout) ... */}
         <div className="header-right">
           <span className="user-info">usuario: {perfil ? perfil.email : (userData?.email || '...') }</span>
           <button onClick={ejecutarLogoutYRedirigir} className="logout-btn">Cerrar sesión</button>
         </div>
      </header>
      <div className="alumno-container">
        <aside className="alumno-sidebar">
          <nav className="sidebar-nav">
             {/* Menú */}
            <div className={`nav-item ${activeMenu === 'qr' ? 'active' : ''}`} onClick={() => setActiveMenu('qr')}>📱 Mi QR</div>
            <div className={`nav-item ${activeMenu === 'horarios' ? 'active' : ''}`} onClick={() => setActiveMenu('horarios')}>🕒 Mis Horarios</div>
            <div className={`nav-item ${activeMenu === 'perfil' ? 'active' : ''}`} onClick={() => setActiveMenu('perfil')}>👤 Mi Perfil</div>
          </nav>
        </aside>
        <main className="alumno-main">
          {/* Métricas */}
          <div className="metrics-grid">
             <div className="metric-card"><div className="metric-icon">📚</div><div className="metric-content"><h3>Clases Esta Semana</h3><div className="metric-value">{loading ? '...' : metricas.clasesEstaSemana}</div></div></div>
             <div className="metric-card"><div className="metric-icon">✅</div><div className="metric-content"><h3>Asistencias Totales</h3><div className="metric-value">{loading ? '...' : metricas.asistenciasTotales}</div></div></div>
             <div className="metric-card"><div className="metric-icon">📊</div><div className="metric-content"><h3>Porcentaje Asist.</h3><div className="metric-value">{loading ? '...' : `${metricas.porcentajeAsistencia}%`}</div></div></div>
             <div className="metric-card"><div className="metric-icon">🎓</div><div className="metric-content"><h3>Materias Inscritas</h3><div className="metric-value">{loading ? '...' : metricas.totalMaterias}</div></div></div>
          </div>
          {/* Contenido */}
          <div className="content-area">
            {renderContent()}
          </div>
        </main>
      </div>
       {/* Modal Editar Perfil (usa lógica mock) */}
       {mostrarEditarPerfil && renderEditarPerfil()}
    </div>
  );
};

export default DashboardAlumno;