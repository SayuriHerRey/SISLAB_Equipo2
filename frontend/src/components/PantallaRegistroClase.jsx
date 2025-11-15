import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../App.css';
import api from '../api.js'; 
// No se usa useNavigate

const PantallaRegistroClase = () => {
  // Estados para la info de la clase (ahora vendrán del backend)
  const [claseInfo, setClaseInfo] = useState(null); 
  const [alumnosRegistrados, setAlumnosRegistrados] = useState([]); 
  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    registrados: 0,
    porcentaje: 0,
    presentes: 0,
    tardanzas: 0,
    faltas: 0
  });
  const [loading, setLoading] = useState(false); // Para el POST
  const [loadingClase, setLoadingClase] = useState(true); // Para el GET inicial
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const qrInputRef = useRef(null);
  const [horaActual, setHoraActual] = useState(new Date()); // Estado para el reloj

  
  // --- FUNCIÓN PARA CARGAR LA CLASE ACTIVA ---
  const cargarClaseActiva = useCallback(async () => {
    setLoadingClase(true);
    setMensaje({ texto: 'Buscando clase activa...', tipo: 'aviso' });
    try {
      const response = await api.get('/asistencias/clase-activa');
      const clase = response.data; 

      if (clase) {
        setClaseInfo({
          id_clase: clase.id_clase,
          materia: clase.nombre_materia,
          laboratorio: clase.nombre_laboratorio,
          maestro: clase.nombre_docente,
          grupo: clase.nombre_grupo,
          horario: `${clase.hora_inicio.substring(0, 5)} - ${clase.hora_fin.substring(0, 5)}`,
          fecha: new Date(clase.fecha).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }) 
        });
        const totalAlumnos = parseInt(clase.total_alumnos_grupo) || 0;
        setEstadisticas(prev => ({
          ...prev,
          totalAlumnos: totalAlumnos,
          faltas: totalAlumnos - (prev.presentes + prev.tardanzas) 
        }));
        setMensaje({ texto: '', tipo: '' }); 
      } else {
        setClaseInfo(null);
        setEstadisticas({ totalAlumnos: 0, registrados: 0, porcentaje: 0, presentes: 0, tardanzas: 0, faltas: 0 });
        setMensaje({ texto: 'No hay ninguna clase activa programada para este momento.', tipo: 'aviso' });
      }
    } catch (err) {
      console.error("Error al cargar clase activa:", err);
      setMensaje({ texto: 'Error al conectar con el servidor para buscar clase.', tipo: 'error' });
    }
    setLoadingClase(false);
    qrInputRef.current?.focus();
  }, []); 

  // --- FUNCIÓN PARA ENVIAR EL QR AL BACKEND ---
  const handleRegistro = useCallback(async (qrCode) => {
    if (!qrCode || loading) return;
    if (!claseInfo && !loadingClase) { 
        setMensaje({ texto: '❌ No se puede registrar: No hay clase activa.', tipo: 'error' });
        setQrCodeInput('');
        return;
    }

    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const response = await api.post('/asistencias/registrar', { qrCode });
      const resultado = response.data;

      if (resultado.yaRegistrado) {
        setMensaje({ texto: `⚠️ ${resultado.msg || `El usuario con QR ${qrCode} ya se había registrado.`}`, tipo: 'aviso' });
      } else {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN DE LA FOTO! ---
        const nuevoRegistro = {
          id: Date.now(), 
          nombre: resultado.nombre,
          matricula: resultado.identificador, 
          foto_perfil: resultado.foto_perfil 
                       ? `http://localhost:5000${resultado.foto_perfil}` // URL Completa del Backend
                       : '/default-avatar.png', // Fallback a carpeta /public
          horaRegistro: new Date(resultado.hora_ingreso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          estado: resultado.estado,
          grupo: resultado.rol === 'docente' ? 'Docente' : (resultado.grupo || 'N/A'),
          rol: resultado.rol 
        };
        // ------------------------------------------

        setAlumnosRegistrados(prev => [nuevoRegistro, ...prev]);
        
        setEstadisticas(prev => {
           const esAlumno = resultado.rol === 'alumno';
           const registrados = prev.registrados + 1; 
           const presentes = prev.presentes + (esAlumno && resultado.estado === 'presente' ? 1 : 0);
           const tardanzas = prev.tardanzas + (esAlumno && resultado.estado === 'tardanza' ? 1 : 0);
           const faltas = Math.max(0, prev.totalAlumnos - (presentes + tardanzas));
           const porcentaje = prev.totalAlumnos > 0 ? Math.round(((presentes + tardanzas) / prev.totalAlumnos) * 100) : 0;
           return { ...prev, registrados, presentes, tardanzas, faltas, porcentaje };
        });

        setMensaje({ texto: `✅ ¡Asistencia de ${resultado.nombre} (${resultado.rol}) registrada! (${resultado.estado})`, tipo: 'exito' });
      }

    } catch (err) {
      console.error("Error al registrar asistencia:", err);
      if (err.response?.data?.msg) { 
        setMensaje({ texto: `❌ Error: ${err.response.data.msg}`, tipo: 'error' });
      } else {
        setMensaje({ texto: '❌ Error de conexión al registrar.', tipo: 'error' });
      }
    }

    setLoading(false);
    setQrCodeInput(''); 
    qrInputRef.current?.focus(); 

  }, [loading, claseInfo, loadingClase, estadisticas.totalAlumnos]); 

  useEffect(() => {
    cargarClaseActiva(); 
    
    const timerId = setInterval(() => {
      setHoraActual(new Date()); 
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [cargarClaseActiva]); 

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRegistro(qrCodeInput);
    }
  };

  const getColorEstado = (estado) => {
    switch(estado) {
      case 'presente': return '#10b981';
      case 'tardanza': return '#f59e0b';
      default: return '#6b7280';
    }
  };
  const getTextoEstado = (estado) => {
    switch(estado) {
      case 'presente': return 'Presente';
      case 'tardanza': return 'Tardanza';
      default: return 'Registrado';
    }
  };
  const getIconoEstado = (estado) => {
    switch(estado) {
      case 'presente': return '✅';
      case 'tardanza': return '⚠️';
      default: return '✔️';
    }
  };

  // --- RETURN Principal (JSX) ---
  return (
    <div className="pantalla-registro-clase">
      
      <header className="clase-header">
        <div className="clase-info-principal">
          <h1 className="clase-titulo">{claseInfo ? claseInfo.materia : (loadingClase ? 'Buscando clase...' : 'Sin Clase Activa')}</h1>
          {claseInfo && (
            <div className="clase-detalles">
              <div className="detalle-item">🏢 <span className="detalle-texto">{claseInfo.laboratorio}</span></div>
              <div className="detalle-item">👨‍🏫 <span className="detalle-texto">{claseInfo.maestro}</span></div>
              <div className="detalle-item">👥 <span className="detalle-texto">{claseInfo.grupo}</span></div>
              <div className="detalle-item">🕒 <span className="detalle-texto">{claseInfo.horario}</span></div>
              <div className="detalle-item">📅 <span className="detalle-texto">{claseInfo.fecha}</span></div>
            </div>
          )}
        </div>
        
        <div className="clase-estadisticas">
           <div className="estadistica-card">
             <div className="estadistica-valor">{loadingClase ? '...' : estadisticas.registrados}</div>
             <div className="estadistica-label">Registrados</div>
             <div className="estadistica-total">de {loadingClase ? '...' : estadisticas.totalAlumnos}</div>
           </div>
           <div className="estadistica-card">
             <div className="estadistica-valor" style={{color: '#10b981'}}>{loadingClase ? '...' : estadisticas.presentes}</div>
             <div className="estadistica-label">Presentes</div>
           </div>
           <div className="estadistica-card">
             <div className="estadistica-valor" style={{color: '#f59e0b'}}>{loadingClase ? '...' : estadisticas.tardanzas}</div>
              <div className="estadistica-label">Tardanzas</div>
           </div>
            <div className="estadistica-card">
              <div className="estadistica-valor" style={{color: '#ef4444'}}>{loadingClase ? '...' : estadisticas.faltas}</div>
              <div className="estadistica-label">Faltas</div>
            </div>
        </div>
      </header>

      <div className="input-qr-panel">
        <input ref={qrInputRef} type="text" value={qrCodeInput} onChange={(e) => setQrCodeInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Esperando escaneo de Código QR..." className="input-qr" disabled={loading || loadingClase} />
        <button onClick={() => handleRegistro(qrCodeInput)} className="btn-registrar-qr" disabled={loading || loadingClase || !qrCodeInput}>
          {loading ? 'Registrando...' : 'Registrar Manual'}
        </button>
      </div>
      {mensaje.texto && (<div className={`mensaje-registro ${mensaje.tipo}`}>{mensaje.texto}</div>)}

      <div className="info-panel">
        <div className="contador-tiempo-real">
           <span className="contador-texto">{alumnosRegistrados.length} usuarios registrados en tiempo real</span>
           <span className="tiempo-actualizacion">
             Hora actual: {horaActual.toLocaleTimeString('es-MX')}
           </span>
        </div>
      </div>

      <div className="alumnos-grid">
        {loadingClase ? (
            <div className="no-alumnos"><h3>Buscando clase...</h3></div>
        ) : alumnosRegistrados.length === 0 ? (
          <div className="no-alumnos">
            <h3>Esperando registros...</h3>
            <p>Los usuarios aparecerán aquí cuando se registren con su QR</p>
          </div>
        ) : (
          alumnosRegistrados.map(usuario => ( 
            <div key={`${usuario.rol}-${usuario.id}`} className="ficha-alumno"> 
              <div className="ficha-header">
                <div className="ficha-avatar">
                   <div className="avatar-container">
                     <img 
                       src={usuario.foto_perfil} // <-- Lee la URL completa o el fallback
                       alt={`Foto de ${usuario.nombre}`} 
                       className="avatar-alumno" 
                     />
                     {/* ------------------------------------------- */}
                     <div className="estado-badge" style={{ backgroundColor: getColorEstado(usuario.estado) }}>
                       {getIconoEstado(usuario.estado)}
                     </div>
                   </div>
                </div>
                <div className="ficha-info-principal">
                  <h3 className="alumno-nombre">{usuario.nombre} ({usuario.rol})</h3>
                  <div className="alumno-datos">
                    <span className="alumno-matricula">{usuario.matricula}</span>
                    <span className="alumno-grupo">{usuario.grupo}</span>
                  </div>
                </div>
              </div>
              <div className="ficha-detalles">
                <div className="detalle-hora">🕒 <span className="hora-texto">{usuario.horaRegistro}</span></div>
                <div className="detalle-estado" style={{ color: getColorEstado(usuario.estado) }}>
                   {getIconoEstado(usuario.estado)} <span className="estado-texto">{getTextoEstado(usuario.estado)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="clase-footer">
         <div className="footer-info">
           <p><strong>Sistema de Asistencia SISLAB</strong> - UNACH</p>
           <p>Registro automático por código QR</p>
         </div>
         <div className="footer-estadisticas">
            <div className="progreso-asistencia">
              <div className="progreso-info">
                 <span className="progreso-porcentaje">{estadisticas.porcentaje}%</span>
                 <span className="progreso-texto">de asistencia</span>
              </div>
              <div className="progreso-bar">
                 <div className="progreso-fill" style={{ width: `${estadisticas.porcentaje}%` }}></div>
              </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default PantallaRegistroClase;