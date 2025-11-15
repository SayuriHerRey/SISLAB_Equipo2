import React, { useState, useEffect, useCallback } from 'react'; // <-- Añadido useCallback
import '../App.css'; // Asumiendo que usas los mismos estilos
import api from '../api.js'; // Importa el cliente API con interceptor
import { QRCodeSVG } from 'qrcode.react'; // Importa la librería para generar QR
import { useNavigate } from 'react-router-dom';

const DashboardDocente = ({ userData, onLogout }) => {
  // Función para generar reportes
  const navigate = useNavigate();
  

  // --- Estados para los datos del backend ---
  const [activeMenu, setActiveMenu] = useState('qr'); // Menú activo, empieza en QR
  const [perfil, setPerfil] = useState(null); // Para guardar datos de /mi-perfil
  const [clases, setClases] = useState([]); // Para guardar datos de /mis-clases
  const [metricas, setMetricas] = useState({ // Para guardar datos de /mis-metricas
    clasesHoy: 0,
    totalClases: 0,
    asistenciasHoy: 0, // Asistencias DE ALUMNOS en sus clases
    totalMaterias: 0
  });
  const [loading, setLoading] = useState(true); // O false, dependiendo de tu lógica inicial
  const [error, setError] = useState(null); // Para errores

  const [misReportes, setMisReportes] = useState([]);

  // --- ¡NUEVO ESTADO PARA EL PERIODO DEL REPORTE! ---
  const [periodoReporte, setPeriodoReporte] = useState('semana'); // 'semana' por defecto
// --------------------------------------------------

  const [claseActualInfo, setClaseActualInfo] = useState(null); // Info of the active class
  const [asistenciasClaseActual, setAsistenciasClaseActual] = useState([]); // Students attending

  // (Estados para editar perfil - los dejamos como estaban, usando mocks por ahora)
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(userData?.foto_perfil || '/default-avatar.png');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  // --- ¡NUEVO ESTADO PARA EL ARCHIVO DE FOTO! ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState([]); // Para la vista Asistencias (pendiente)

  const handleGenerarReporte = async () => {// --- FUNCIÓN PARA GENERAR REPORTE (Versión Limpia) ---

  setLoading(true); // Indica que está generando
  // setMensaje(''); // Descomenta si tienes un estado 'mensaje' general y quieres limpiarlo
  setError(null); // Limpia errores anteriores

  try {
    // Llama al endpoint del backend con el periodo seleccionado
    const response = await api.post('/docentes/reportes/generar-asistencia', { periodo: periodoReporte });

    setLoading(false);
    alert(response.data.msg || 'Reporte generado exitosamente.'); // Muestra mensaje de éxito

    // Opcional: Recarga la lista de reportes para mostrar el nuevo
    if (activeMenu !== 'reportes') {
        setActiveMenu('reportes'); // Cambia a la pestaña para disparar useEffect
    } else {
        cargarDatosDocente(); // Si ya estamos en reportes, solo recarga
    }

  } catch (err) {
    setLoading(false);
    console.error("Error al generar reporte:", err);
    if (err.response && err.response.data && err.response.data.msg) {
      // Muestra el error específico del backend (ej. "No se encontraron clases...")
      alert(`❌ Error al generar reporte: ${err.response.data.msg}`); 
    } else {
      // Error genérico si no hay respuesta del backend
      alert("❌ Error de conexión al generar reporte.");
    }
    setError("Error al generar reporte."); // Actualiza estado de error si es necesario
  }
};

// --- FUNCIÓN Ver Reporte (CON MÁS LOGS) ---
  const handleVerReporte = (reporte) => {
    console.log("Intentando ver reporte:", reporte); // Log 1: Verificamos que llega el reporte
    if (reporte.datos_reportados) {
      console.log("Datos encontrados, mostrando alert."); // Log 2: Sabemos que entra al if
      const resumenFormateado = JSON.stringify(reporte.datos_reportados, null, 2); 
      alert(`Resumen del Reporte:\n--------------------\n${reporte.descripcion}\n--------------------\n${resumenFormateado}`);
    } else {
      console.log("No se encontraron datos_reportados en el objeto reporte."); // Log 3: Sabemos que entra al else
      alert('Los detalles (datos JSON) de este reporte no están disponibles.');
    }
  };
  // ---------------------------------------------

  // --- ¡NUEVA FUNCIÓN PARA EXPORTAR LISTA DE CLASE! ---
  const handleExportarAsistenciaPdf = async () => {
    // Verifica si hay una clase activa cargada
    if (!claseActualInfo || !claseActualInfo.id_clase) {
      alert("No hay una clase activa seleccionada para exportar.");
      return;
    }

    const id_clase = claseActualInfo.id_clase;
    console.log(`Intentando exportar PDF para clase ID: ${id_clase}`);
    
    // Reusa el estado 'loading' general
    setLoading(true);
    try {
      // Llama al endpoint del backend que envía el token
      const downloadUrl = `/docentes/clase/${id_clase}/asistencia-pdf`;
      const response = await api.get(downloadUrl, {
        responseType: 'blob', // Pide el PDF como archivo binario
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = `Asistencia_${claseActualInfo.nombre_materia}.pdf`; 
      const disposition = response.headers['content-disposition'];
       if (disposition?.includes('attachment')) { 
         const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
         const matches = filenameRegex.exec(disposition);
         if (matches?.[1]) { filename = matches[1].replace(/['"]/g, ''); }
      }
      
      link.setAttribute('download', filename); 
      document.body.appendChild(link);
      link.click(); 
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setLoading(false);

    } catch (err) {
      setLoading(false);
      console.error("Error al exportar PDF de asistencia:", err);
      // Intenta leer el error por si la respuesta fue JSON (ej. 403 Forbidden)
      try {
         const errorJson = JSON.parse(await err.response.data.text());
         alert(`❌ Error al descargar: ${errorJson.msg || 'Error desconocido.'}`);
      } catch (parseError) {
         alert('❌ Ocurrió un error al intentar descargar el PDF.');
      }
    }
  };

 // --- FUNCIÓN Descargar Reporte (CON AXIOS Y BLOB para PDF) ---
  const handleDescargarReporte = async (reporte) => { // <-- Asegúrate que sea async
    console.log("Intentando descargar PDF con Axios para reporte:", reporte); 
    // Verifica si hay datos (necesarios para generar PDF)
    if (reporte.id_reporte && reporte.datos_reportados) { 
      const downloadUrl = `/docentes/mis-reportes/${reporte.id_reporte}/download`;

      setLoading(true); 
      try {
        console.log("Llamando a api.get con responseType: 'blob'");
        // Usa api.get que incluye token y pide respuesta como Blob
        const response = await api.get(downloadUrl, {
          responseType: 'blob', // Pide el PDF como archivo binario
        });

        // Crea URL temporal para el Blob
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })); // Especifica el tipo PDF

        // Crea enlace temporal
        const link = document.createElement('a');
        link.href = url;

        // Nombre del archivo (el backend ya lo sugiere en Content-Disposition)
        let filename = `reporte_${reporte.tipo}_${reporte.id_reporte}.pdf`; // Nombre por defecto
        const disposition = response.headers['content-disposition'];
         if (disposition && disposition.includes('attachment')) { // Verifica que sea adjunto
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches?.[1]) { // Usa optional chaining
              filename = matches[1].replace(/['"]/g, '');
            }
        }
        link.setAttribute('download', filename); // Asigna el nombre de archivo PDF

        document.body.appendChild(link);
        link.click(); // Simula clic para descargar

        // Limpia
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log("Descarga PDF iniciada para:", filename);
        setLoading(false);

      } catch (err) {
        setLoading(false);
        console.error("Error al descargar el archivo PDF:", err);
         if (err.response?.status === 404) {
             alert('❌ Error: Reporte no encontrado o sin datos para generar PDF.');
         } else if (err.response?.status === 403) {
             alert('❌ Error: No tienes permiso para descargar este reporte.');
         } else {
             // Intenta leer el error si la respuesta fue JSON (ej. si el backend falló antes de generar PDF)
             try {
                 const errorData = JSON.parse(await err.response.data.text());
                 alert(`❌ Error al descargar: ${errorData.msg || 'Error desconocido del servidor.'}`);
             } catch (parseError){
                 alert('❌ Ocurrió un error al intentar descargar el archivo PDF.');
             }
         }
      }
    } else {
      console.log("Falta id_reporte o datos_reportados para la descarga PDF."); 
      alert('⚠️ Este reporte no tiene datos disponibles para generar el PDF.');
    }
  };
  // --------------------------------------------------------
  // --------------------------------------------------------
   
  // --- Función para cargar datos (conectada al backend) ---
  const cargarDatosDocente = useCallback(async (menuActual = activeMenu) => {
     setLoading(true);
     setError(null);
     try {
       // --- Fetch common data (profile, metrics) ---
       const perfilPromise = api.get('/docentes/mi-perfil');
       const metricasPromise = api.get('/docentes/mis-metricas');
       let dataPromises = [perfilPromise, metricasPromise];

       // --- Fetch data specific to the active menu ---
       if (menuActual === 'horarios') {
         // Load all classes for the schedule view
         dataPromises.push(api.get('/docentes/mis-clases')); 
       } else if (menuActual === 'asistencias') {
         // Load current class attendance
         dataPromises.push(api.get('/docentes/asistencias/clase-actual'));
         // --- ¡AÑADE ESTE ELSE IF! ---
       } else if (menuActual === 'reportes') { 
         dataPromises.push(api.get('/docentes/mis-reportes')); 
       // -----------------------------
       } else {
         // For other views (like QR, Perfil), load only today's classes
         dataPromises.push(api.get('/docentes/mis-clases?fecha=hoy'));
       }

       // --- Execute all promises ---
       const results = await Promise.all(dataPromises);
       const perfilRes = results[0];
       const metricasRes = results[1];
       const specificDataRes = results[2]; // This holds either classes or attendance data

       // --- Update common states ---
       setPerfil(perfilRes.data);
       setMetricas(metricasRes.data);
       if (perfilRes.data.foto_perfil) {
           setFotoPerfil(perfilRes.data.foto_perfil);
       }

       // --- Update specific states based on menu ---
       if (menuActual === 'horarios') {
         setClases(specificDataRes.data); 
         setClaseActualInfo(null); // Clear current class info
         setAsistenciasClaseActual([]); // Clear current attendance
         setMisReportes([]);
       } else if (menuActual === 'asistencias') {
         // Store current class info and attendance
         setClaseActualInfo(specificDataRes.data.claseActual); 
         setAsistenciasClaseActual(specificDataRes.data.asistencias);
         setMisReportes([]);
         // Keep 'clases' state potentially outdated or clear it if needed
         // setClases([]); 
         } else if (menuActual === 'reportes') { 
         setMisReportes(specificDataRes.data); // Guarda los reportes
         setClases([]); // Limpia clases si no estamos en horarios
         // ... (limpia otros estados)
       // -----------------------------
       } else { 
         // For QR, Perfil, etc., update the 'clases' state (usually just today's)
         setClases(specificDataRes.data); 
         setClaseActualInfo(null);
         setAsistenciasClaseActual([]);
          setMisReportes([]);
       }

     } catch (err) { /* ... (your existing error handling) ... */ }
     setLoading(false);
   }, [activeMenu, onLogout, navigate]); // Dependencies remain the same 

  // --- useEffect para cargar datos al montar y al cambiar menú ---
  useEffect(() => {
    cargarDatosDocente(activeMenu); 
  }, [activeMenu, cargarDatosDocente]); // Se ejecuta cuando cambia el menú

   // --- Funciones mock para guardar perfil (se quedan por ahora) ---
   const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Guarda el ARCHIVO en el estado
      setSelectedFile(file); 
      
      // Muestra la previsualización (esto se queda igual)
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPerfil(event.target.result); // Muestra la imagen localmente
      };
      reader.readAsDataURL(file);
    } else {
        setSelectedFile(null); // Limpia si no selecciona archivo
    }
  };
   // --- FUNCIÓN guardarPerfil (CONECTADA) ---
  const guardarPerfil = async () => {
    // 1. Verifica si se seleccionó un archivo nuevo
    if (!selectedFile) {
      setMensaje('⚠️ No has seleccionado una nueva foto.');
      return;
    }

    setLoading(true); // Usamos el estado 'loading' general
    setMensaje('');
    setError(null);

    // 2. Crea un objeto FormData para enviar el archivo
    const formData = new FormData();
    // Añade el archivo. 'fotoPerfil' DEBE coincidir con upload.single() en el backend
    formData.append('fotoPerfil', selectedFile); 

    try {
      // 3. Llama al endpoint PUT con FormData
      //    IMPORTANTE: No establezcas 'Content-Type' manualmente, 
      //    el navegador lo hará correctamente para FormData.
      const response = await api.put('/docentes/mi-perfil/foto', formData);

      // 4. Éxito
      setLoading(false);
      const nuevaRutaFoto = response.data.foto_perfil;
      // Actualizamos el estado 'perfil' localmente si existe
      if(perfil) {
          setPerfil(prev => ({...prev, foto_perfil: nuevaRutaFoto}));
      }
      // Aseguramos que la previsualización muestre la foto del servidor (opcional)
      // O podrías simplemente mostrar el mensaje y dejar que recargue
      // setFotoPerfil(nuevaRutaFoto); // Esto podría requerir ajustar la URL base
      setMensaje(`✅ ${response.data.msg || 'Foto actualizada.'}`);
      setSelectedFile(null); // Limpia el archivo seleccionado
      setTimeout(() => setMensaje(''), 5000);

    } catch (err) {
      // 5. Error
      setLoading(false);
      console.error("Error al guardar foto:", err);
      if (err.response?.data?.msg) { 
        setMensaje(`❌ Error: ${err.response.data.msg}`); 
      } else {
        setMensaje("❌ Error de conexión al guardar foto.");
      }
    }
  };
  // ---------------------------------------
   // --- Función para CAMBIAR CONTRASEÑA (conectada) ---
  // --- Función para CAMBIAR CONTRASEÑA (conectada) ---
   const cambiarContraseña = async () => {
    // 1. Validaciones del frontend
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
      // 2. Llama al endpoint del backend
      const response = await api.put('/docentes/mi-perfil/password', {
        passwordActual: passwordActual,
        nuevaPassword: nuevaPassword 
      });

      // 3. Éxito
      setLoading(false);
      setMensaje(`✅ ${response.data.msg || 'Contraseña cambiada exitosamente.'}`);
      setCambiarPassword(false); // Cierra el formulario de cambio
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setMensaje(''), 5000); 

    } catch (err) {
      // 4. Error 
      setLoading(false);
      console.error("Error al cambiar contraseña:", err);
      if (err.response?.data?.msg) { // Optional chaining
        setMensaje(`❌ Error: ${err.response.data.msg}`); 
      } else {
        setMensaje("❌ Error de conexión al cambiar contraseña.");
      }
    }
  };
  // ----------------------------------------------------

  // --- Funciones para renderizar contenido ---

  

  // Vista "Mi QR" (conectada)
  const renderQRDocente = () => (
    <div className="qr-section">
      <h2>Mi QR de Identificación</h2>
      {loading && !perfil ? <div className="loading">Cargando QR...</div> : perfil && perfil.qr_code ? (
        <div className="docente-info-card"> {/* Reutiliza tu estilo */}
          <div className="docente-header">
            <h3>{perfil.nombre}</h3>
            <p className="no-empleado">No. Empleado: {perfil.no_empleado}</p>
            <p className="departamento">Departamento: {perfil.nombre_departamento || 'No asignado'}</p>
          </div>
          <div className="qr-content">
            <div className="qr-container">
              <h4>Mi Código QR de Identificación</h4>
              <div className="qr-code">
                {/* USA QRCodeSVG */}
                <QRCodeSVG 
                  value={perfil.qr_code} 
                  size={200} 
                  level="H" 
                  includeMargin={true}
                  className="qr-code-image" // Añade clase si necesitas estilo
                />
              </div>
              <p className="qr-instructions">
                Este QR identifica tu cuenta de docente. Puede ser usado para acceso a laboratorios y verificación de identidad.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="error-message">{error || 'No se pudo cargar el código QR.'}</p>
      )}
    </div>
  );

  // Vista "Mis Horarios" (conectada)
  const renderHorarios = () => (
     <div className="horarios-docente-section">
       <div className="section-header">
         <h2>Mis Horarios ({clases.length})</h2> 
         <button className="btn-refresh" onClick={() => cargarDatosDocente()} disabled={loading}>
           {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
         </button>
       </div>
       {loading ? ( <div className="loading">Cargando horarios...</div> ) 
        : error ? ( <div className="error-message">{error}</div> ) 
        : clases.length === 0 ? ( <div className="no-data">No tienes clases programadas.</div> ) 
        : (
         <div className="clases-grid"> 
           {clases.map(clase => (
             <div key={clase.id_clase} className="clase-card-docente"> 
               <div className="clase-header">
                 {/* Usa los nombres del backend */}
                 <h3>{clase.nombre_materia}</h3> 
                 <span className="clase-fecha">{new Date(clase.fecha).toLocaleDateString('es-ES')}</span>
               </div>
               <div className="clase-info">
                 <p><strong>Horario:</strong> {`${clase.hora_inicio.substring(0,5)} - ${clase.hora_fin.substring(0,5)}`}</p>
                 <p><strong>Laboratorio:</strong> {clase.nombre_laboratorio}</p> 
                 <p><strong>Grupo:</strong> {clase.nombre_grupo}</p> 
                 <p><strong>Estado:</strong> <span className={`badge estado-${clase.estado}`}>{clase.estado}</span></p>
                 {clase.tema_clase && <p><strong>Tema:</strong> {clase.tema_clase}</p>}
               </div>
               <div className="clase-actions">
                 <button className="btn-ver-detalles" onClick={() => setActiveMenu('asistencias')}> 
                   Ver Asistencia (Hoy)
                 </button>
               </div>
             </div>
           ))}
         </div>
       )}
     </div>
  );

   // --- UPDATED RENDERASISTENCIAS ---
   const renderAsistencias = () => (
     <div className="asistencias-section"> {/* Reuse admin style if applicable */}
        <div className="section-header">
           <h2>Asistencias de Clase Actual</h2>
           <div className="header-actions"> 
              {/* ¡AÑADE ESTE BOTÓN! */}
              <button 
                className="btn-exportar" // Necesitarás un estilo para 'btn-exportar'
                onClick={handleExportarAsistenciaPdf} 
                disabled={loading || !claseActualInfo}
              >
                Exportar PDF
              </button>
              <button className="btn-refresh" onClick={() => cargarDatosDocente()} disabled={loading}> 
                 {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
              </button>
           </div>
        </div>

        {loading ? ( <div className="loading">Cargando asistencias...</div> )
         : error ? ( <div className="error-message">{error}</div> )
         // Check if claseActualInfo exists (meaning a class is active)
         : !claseActualInfo ? ( 
             <div className="no-data info-card"> {/* Added info-card style */}
                <h3>No hay ninguna clase activa en este momento.</h3>
                <p>La lista de asistencia aparecerá aquí cuando inicie una de tus clases programadas.</p>
             </div>
         ) : (
           // Display class info and attendance list
           <>
             <div className="info-card"> {/* Display current class details */}
               <h3>Clase Actual: {claseActualInfo.nombre_materia}</h3>
               <p><strong>Grupo:</strong> {claseActualInfo.nombre_grupo}</p>
               <p><strong>Laboratorio:</strong> {claseActualInfo.nombre_laboratorio}</p>
               <p><strong>Horario:</strong> {`${claseActualInfo.hora_inicio.substring(0,5)} - ${claseActualInfo.hora_fin.substring(0,5)}`}</p>
             </div>

             <div className="asistencias-list">
               <h3>Alumnos Registrados ({asistenciasClaseActual.length})</h3>
               {asistenciasClaseActual.length === 0 ? (
                 <div className="no-data">No hay asistencias registradas aún para esta clase.</div>
               ) : (
                 <div className="table-container">
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th>Foto</th>
                         <th>Nombre</th>
                         <th>Matrícula</th>
                         <th>Email</th>
                         <th>Grupo</th>
                         <th>Hora Ingreso</th>
                         <th>Estado</th>
                       </tr>
                     </thead>
                     <tbody>
                       {asistenciasClaseActual.map(asistencia => (
                         <tr key={asistencia.id_asistencia}>
                           <td>
                             <img 
                               src={asistencia.foto_perfil || '/default-avatar.png'} 
                               alt="Foto" 
                               className="foto-tabla"
                             />
                           </td>
                           <td>{asistencia.nombre_alumno}</td>
                           <td>{asistencia.matricula}</td>
                           <td>{asistencia.email}</td>
                           <td>{asistencia.grupo_alumno}</td>
                           <td>{new Date(asistencia.hora_ingreso).toLocaleTimeString('es-MX')}</td>
                           <td>
                             <span className={`badge estado-${asistencia.estado}`}>
                               {asistencia.estado}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           </>
         )}
     </div>
   );
   // --------------------------------

  // --- ¡FUNCIÓN RENDERREPORTES ACTUALIZADA! ---
   const renderReportes = () => (
     <div className="reportes-docente-section">
        <div className="section-header">
           <h2>Mis Reportes Generados ({misReportes.length})</h2> 
           {/* Aquí iría el botón para Generar Nuevo Reporte */}
           <button className="btn-refresh" onClick={() => cargarDatosDocente()} disabled={loading}>
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
           </button>
        </div>

        {/* --- SECCIÓN DE GENERACIÓN --- */}
        <div className="reportes-grid"> {/* O usa un layout adecuado */}
            <div className="reporte-card"> {/* Tarjeta para generar */}
              <h3>📊 Generar Reporte de Asistencias</h3>
              <p>Selecciona el periodo para generar un nuevo reporte.</p>
              <div className="reporte-options">
                {/* Select conectado al estado 'periodoReporte' */}
                <select 
                   className="periodo-select" 
                   value={periodoReporte} 
                   onChange={(e) => setPeriodoReporte(e.target.value)}
                >
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  {/* <option value="semestre">Este semestre</option> */}
                </select>
                {/* Botón conectado a handleGenerarReporte */}
                <button 
                   className="btn-generar-reporte" 
                   onClick={handleGenerarReporte}
                   disabled={loading} // Deshabilita mientras carga
                >
                  {loading ? 'Generando...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
             {/* ... (Tus otras tarjetas de Estadísticas y Exportar se quedan igual por ahora) ... */}
        </div>
        {/* --------------------------- */}

        {/* Podríamos añadir filtros aquí después */}

         {loading ? ( <div className="loading">Cargando reportes...</div> ) 
          : error ? ( <div className="error-message">{error}</div> ) 
          : misReportes.length === 0 ? ( 
             <div className="no-data info-card"> 
                <h3>No has generado ningún reporte todavía.</h3>
                {/* Aquí iría info sobre cómo generar */}
             </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Fecha Generación</th>
                    <th>Rango</th>
                    <th>Archivo</th>
                    {/* <th>Resumen (JSON)</th> */}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {misReportes.map(reporte => (
                    <tr key={reporte.id_reporte}>
                      <td><strong>{reporte.descripcion || 'Sin descripción'}</strong></td>
                      <td><span className={`badge tipo-${reporte.tipo}`}>{reporte.tipo}</span></td>
                      <td>{new Date(reporte.fecha_generacion).toLocaleString('es-MX')}</td>
                      <td>
                        {reporte.rango_fecha_inicio && reporte.rango_fecha_fin 
                          ? `${new Date(reporte.rango_fecha_inicio).toLocaleDateString('es-ES')} - ${new Date(reporte.rango_fecha_fin).toLocaleDateString('es-ES')}`
                          : 'N/A'}
                      </td>
                      <td>{reporte.nombre_archivo || 'No generado'}</td>
                      {/* <td><pre>{JSON.stringify(reporte.datos_reportados)}</pre></td> */}
                      <td>
                    <div className="acciones-reporte">
                      {/* ¡BOTONES CON onClick CONECTADOS! */}
                      <button 
                        className="btn-ver" 
                        onClick={() => handleVerReporte(reporte)} 
                        title="Ver resumen"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-descargar" 
                        onClick={() => handleDescargarReporte(reporte)} 
                        // Verifica si hay datos JSON para habilitar la descarga
                        disabled={!reporte.datos_reportados || loading} 
                        title={reporte.datos_reportados ? "Descargar PDF" : "No disponible"}
                      >
                        📥
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          )}
     </div>
   );
   // --------------------------------------------------

  // Vista "Editar Perfil" (Usa funciones mock por ahora)
   // --- Vista "Editar Perfil" ---
  const renderEditarPerfil = () => (
    <div className="editar-perfil-section">
      <div className="section-header">
        <h2>Editar Perfil</h2>
        <button 
          className="btn-volver"
          // Vuelve a la vista de perfil y limpia el estado de cambio de contraseña
          onClick={() => {
             setMostrarEditarPerfil(false); 
             setCambiarPassword(false); 
             setMensaje(''); // Limpia mensajes
          }}
        >
          ← Volver al Perfil
        </button>
      </div>

      {/* Muestra mensajes de éxito o error */}
      {mensaje && (
        <div className={`mensaje ${mensaje.includes('✅') ? 'mensaje-exito' : 'mensaje-error'}`}>
          {mensaje}
        </div>
      )}

      <div className="perfil-form">
        {/* Sección para cambiar foto (función guardarPerfil sigue simulada) */}
        <div className="foto-perfil-section">
          <h3>Foto de Perfil</h3>
          <div className="foto-container">
            <div className="foto-preview">
              <img 
    src={
      (fotoPerfil || perfil?.foto_perfil)?.startsWith('http') || !(fotoPerfil || perfil?.foto_perfil)
      ? (fotoPerfil || perfil?.foto_perfil || '/default-avatar.png') 
      : `http://localhost:5000${fotoPerfil || perfil?.foto_perfil}` // <-- Añade URL base
    } 
    alt="Foto de perfil" 
    className="foto-perfil-grande"
  />
            </div>
            <div className="foto-actions">
              <input
                type="file"
                id="foto-input"
                accept="image/*"
                onChange={handleFotoChange} // Usa tu función existente
                className="file-input"
              />
              <label htmlFor="foto-input" className="btn-subir-foto">
                📷 Cambiar Foto
              </label>
              <button 
                onClick={guardarPerfil} // Llama a la función mock (¡PENDIENTE CONECTAR!)
                className="btn-guardar"
                // disabled={!fotoPerfil || fotoPerfil === perfil?.foto_perfil} // Deshabilita si no hay cambios
              >
                💾 Guardar Foto
              </button>
            </div>
          </div>
        </div>

        {/* Sección para cambiar contraseña (conectada) */}
        <div className="password-section">
          <h3>Seguridad</h3>
          {!cambiarPassword ? (
            <button 
              className="btn-cambiar-password"
              onClick={() => { setCambiarPassword(true); setMensaje(''); }} // Limpia mensaje al abrir
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
                  required // Añadido
                />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required // Añadido
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required // Añadido
                />
              </div>
              <div className="password-actions">
                <button 
                  onClick={cambiarContraseña} // Llama a la función conectada
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
                    setMensaje(''); // Limpia mensaje al cancelar
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
      </div>
    </div>
  );
  // ------------------------------------

  // Vista "Mi Perfil" (Conectada a /mi-perfil)
  const renderPerfil = () => {
    if (mostrarEditarPerfil) {
      return renderEditarPerfil();
    }

    return (
     <div className="perfil-section">
       <div className="section-header">
         <h2>Mi Perfil</h2>
         <button 
           className="btn-editar-perfil" 
           onClick={() => setMostrarEditarPerfil(true)} 
         >
           ✏️ Editar Perfil
         </button>
       </div>
       {loading && !perfil ? <div className="loading">Cargando perfil...</div> : perfil ? (
          <div className="perfil-card">
             <div className="perfil-header">
                {/* Usa fotoPerfil (estado local) o perfil.foto_perfil (backend) */}
                <img 
    src={
      (fotoPerfil || perfil?.foto_perfil)?.startsWith('http') || !(fotoPerfil || perfil?.foto_perfil)
      ? (fotoPerfil || perfil?.foto_perfil || '/default-avatar.png') 
      : `http://localhost:5000${fotoPerfil || perfil?.foto_perfil}` // <-- Añade URL base
    } 
    alt="Foto de perfil" 
    className="foto-perfil" 
  />
                <div className="perfil-info">
                   <h3>{perfil.nombre}</h3>
                   <p className="matricula">No. Empleado: {perfil.no_empleado}</p>
                   <p className="email">Email: {perfil.email}</p>
                   <p className="carrera">Docente - Universidad Autónoma de Chiapas</p>
                   <p className="grupo">Departamento: {perfil.nombre_departamento || 'No asignado'}</p>
                </div>
             </div>
             <div className="perfil-details">
                <div className="detail-group">
                   <h4>Información Profesional</h4>
                   <p><strong>Usuario (email):</strong> {userData?.email || perfil.email}</p>
                   <p><strong>Materias Impartidas:</strong> ({metricas.totalMaterias})</p> {/* Usa métricas */}
                   {/* Para Clases Semana/Grupos necesitaríamos lógica extra o endpoint */}
                   <p><strong>Clases Esta Semana:</strong> (pendiente)</p> 
                   <p><strong>Grupos Asignados:</strong> (pendiente)</p>
                </div>
                 <div className="detail-group">
                   <h4>Información de Contacto</h4>
                   <p><strong>No. Empleado:</strong> {perfil.no_empleado}</p>
                   <p><strong>Email Institucional:</strong> {perfil.email}</p>
                   <p><strong>Departamento:</strong> {perfil.nombre_departamento || 'No asignado'}</p>
                   <p><strong>Fecha Contratación:</strong> {perfil.fecha_contratacion ? new Date(perfil.fecha_contratacion).toLocaleDateString('es-ES') : 'N/A'}</p>
                </div>
             </div>
          </div>
       ) : (
          <p className="error-message">{error || 'No se pudo cargar el perfil.'}</p>
       )}
    </div>
   )};

  // --- Selección de contenido a renderizar ---
  const renderContent = () => {
    if (error && !perfil && loading) return <div className="loading">Cargando...</div>; // Muestra carga si hay error pero aún no carga perfil
    if (error && !perfil) return <div className="error-message">{error}</div>; // Muestra error si falla la carga inicial

    // Muestra carga si está cargando Y no hay datos para la vista actual (evita parpadeo)
    if (loading && (
        (activeMenu === 'mi-qr' && !perfil) ||
        (activeMenu === 'mis-horarios' && clases.length === 0) ||
        (activeMenu === 'mi-perfil' && !perfil)
        // Añadir condiciones para asistencias/reportes si es necesario
    )) {
        return <div className="loading">Cargando...</div>;
    }


    switch(activeMenu) {
      case 'qr': return renderQRDocente(); // Cambiado a 'qr' como en tu código original
      case 'horarios': return renderHorarios(); // Cambiado a 'horarios'
      case 'asistencias': return renderAsistencias(); 
      case 'reportes': return renderReportes(); 
      case 'perfil': return renderPerfil(); // Cambiado a 'perfil'
      default: return renderQRDocente(); // Default a QR
    }
  };

  // --- Función wrapper para Logout ---
const ejecutarLogoutYRedirigir = () => {
  onLogout(); 
  navigate('/', { replace: true }); // Cambia '/login' por '/'
};

  // --- RETURN Principal (JSX) ---
  return (
    // Usa las clases CSS de tu código original
    <div className="dashboard-docente"> 
      <header className="docente-header"> 
         <div className="header-left">
           <div className="logo"><span>UNACH</span></div>
           <h1>Panel del Docente - SISLAB</h1>
         </div>
         <div className="header-right">
           <span className="user-info">Docente: {perfil ? perfil.nombre : (userData?.name || 'Cargando...')}</span>
           <button onClick={ejecutarLogoutYRedirigir} className="logout-btn">🚪 Cerrar sesión</button>
         </div>
      </header>
      <div className="docente-container"> 
        <aside className="docente-sidebar"> 
          <nav className="sidebar-nav">
             {/* Menú del Docente (usa los activeMenu de tu código original) */}
            <div className={`nav-item ${activeMenu === 'qr' ? 'active' : ''}`} onClick={() => setActiveMenu('qr')}>📱 Mi QR</div>
            <div className={`nav-item ${activeMenu === 'horarios' ? 'active' : ''}`} onClick={() => setActiveMenu('horarios')}>🕒 Mis Horarios</div>
            <div className={`nav-item ${activeMenu === 'asistencias' ? 'active' : ''}`} onClick={() => setActiveMenu('asistencias')}>✅ Asistencias</div>
            <div className={`nav-item ${activeMenu === 'reportes' ? 'active' : ''}`} onClick={() => setActiveMenu('reportes')}>📊 Reportes</div>
            <div className={`nav-item ${activeMenu === 'perfil' ? 'active' : ''}`} onClick={() => setActiveMenu('perfil')}>👤 Mi Perfil</div>
          </nav>
        </aside>
        <main className="docente-main">
          {/* Tarjetas de Métricas (Usa estado 'metricas') */}
          <div className="metrics-grid">
             <div className="metric-card"><div className="metric-icon">📚</div><div className="metric-content"><h3>Clases Hoy</h3><div className="metric-value">{loading ? '...' : metricas.clasesHoy}</div></div></div>
             <div className="metric-card"><div className="metric-icon">📅</div><div className="metric-content"><h3>Total Clases</h3><div className="metric-value">{loading ? '...' : metricas.totalClases}</div></div></div>
             <div className="metric-card"><div className="metric-icon">✅</div><div className="metric-content"><h3>Asistencias Hoy</h3><div className="metric-value">{loading ? '...' : metricas.asistenciasHoy}</div></div></div>
             <div className="metric-card"><div className="metric-icon">🎓</div><div className="metric-content"><h3>Materias</h3><div className="metric-value">{loading ? '...' : metricas.totalMaterias}</div></div></div>
          </div>
          {/* Área de Contenido Principal */}
          <div className="content-area">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
    );
  }

export default DashboardDocente;