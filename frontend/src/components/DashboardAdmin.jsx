import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../App.css';
import api from '../api.js';
// Datos mock actualizados
const mockData = {
  laboratorios: [
    { 
      id_laboratorio: 1, 
      nombre: 'Laboratorio 1', 
      estado: 'disponible', 
      ubicacion: 'Edificio A, Planta Baja',
      docentes_asignados: ['Dr. Juan Pérez', 'Dra. Ana Martínez'],
      capacidad: 30,
      equipos: 25
    },
    { 
      id_laboratorio: 2, 
      nombre: 'Laboratorio 2', 
      estado: 'ocupado', 
      ubicacion: 'Edificio B, Primer Piso',
      docentes_asignados: ['Mtro. Roberto Sánchez'],
      capacidad: 25,
      equipos: 20
    },
    { 
      id_laboratorio: 3, 
      nombre: 'Laboratorio 3', 
      estado: 'mantenimiento', 
      ubicacion: 'Edificio C, Segundo Piso',
      docentes_asignados: [],
      capacidad: 35,
      equipos: 30
    },
    { 
      id_laboratorio: 4, 
      nombre: 'Laboratorio 4', 
      estado: 'ocupado', 
      ubicacion: 'Edificio C, Segundo Piso',
      docentes_asignados: [],
      capacidad: 35,
      equipos: 30
    }
  ],
  usuarios: [
    { id_usuario: 1, nombre: 'Admin Principal', email: 'admin@unach.mx', rol: 'admin', foto_perfil: '/default-avatar.png', no_empleado: 'A001', grupo: null },
    { id_usuario: 3, nombre: 'María López', email: 'alumno@unach.mx', rol: 'alumno', foto_perfil: '/default-avatar.png', matricula: 'A001', grupo: 'ISC-8A' },
    { id_usuario: 4, nombre: 'Carlos Ruiz', email: 'carlos@unach.mx', rol: 'alumno', foto_perfil: '/default-avatar.png', matricula: 'A002', grupo: 'ISC-8A' }
  ],
  docentes: [
    { 
      id_docente: 1, 
      nombre: 'Dr. Juan Pérez García', 
      no_empleado: 'D001', 
      email: 'docente@unach.mx',
      foto_perfil: '/default-avatar.png',
      materias: ['Programación Avanzada', 'Estructuras de Datos'],
      grupos: ['ISC-8A', 'ISC-8B']
    },
    { 
      id_docente: 2, 
      nombre: 'Dra. Ana Martínez López', 
      no_empleado: 'D002', 
      email: 'ana@unach.mx',
      foto_perfil: '/default-avatar.png',
      materias: ['Bases de Datos', 'Inteligencia Artificial'],
      grupos: ['ISC-8A', 'ISC-7B']
    },
    { 
      id_docente: 3, 
      nombre: 'Mtro. Roberto Sánchez', 
      no_empleado: 'D003', 
      email: 'roberto@unach.mx',
      foto_perfil: '/default-avatar.png',
      materias: ['Redes de Computadoras', 'Sistemas Operativos'],
      grupos: ['ISC-8A', 'ISC-9A']
    }
  ],
  materias: [
    { 
      id_materia: 1, 
      nombre: 'Programación Avanzada', 
      clave: 'PROG101',
      docente: 'Dr. Juan Pérez',
      grupos: ['ISC-8A', 'ISC-8B']
    },
    { 
      id_materia: 2, 
      nombre: 'Bases de Datos', 
      clave: 'BD202',
      docente: 'Dra. Ana Martínez',
      grupos: ['ISC-8A', 'ISC-7B']
    },
    { 
      id_materia: 3, 
      nombre: 'Redes de Computadoras', 
      clave: 'RED303',
      docente: 'Mtro. Roberto Sánchez',
      grupos: ['ISC-8A', 'ISC-9A']
    },
    { 
      id_materia: 4, 
      nombre: 'Inteligencia Artificial', 
      clave: 'IA404',
      docente: 'Dra. Ana Martínez',
      grupos: ['ISC-8A']
    }
  ],
  clases: [
    { id_clase: 1, materia: 'Programación Avanzada', docente: 'Dr. Juan Pérez', laboratorio: 'Laboratorio 1', grupo: 'ISC-8A', fecha: '2024-01-15', hora_inicio: '08:00', hora_fin: '10:00' },
    { id_clase: 2, materia: 'Bases de Datos', docente: 'Dra. Ana Martínez', laboratorio: 'Laboratorio 1', grupo: 'ISC-8B', fecha: '2024-01-15', hora_inicio: '10:00', hora_fin: '12:00' },
    { id_clase: 3, materia: 'Redes de Computadoras', docente: 'Mtro. Roberto Sánchez', laboratorio: 'Laboratorio 2', grupo: 'ISC-8A', fecha: '2024-01-16', hora_inicio: '14:00', hora_fin: '16:00' }
  ],
  asistenciasHoy: [
    { 
      id_asistencia: 1, 
      nombre_persona: 'María López', 
      identificador: 'A001',
      email: 'alumno@unach.mx',
      grupo: 'ISC-8A',
      materia: 'Programación Avanzada',
      laboratorio: 'Laboratorio 1',
      hora_ingreso: new Date().toISOString(),
      tipo: 'alumno',
      foto_perfil: '/default-avatar.png'
    },
    { 
      id_asistencia: 2, 
      nombre_persona: 'Dr. Juan Pérez', 
      identificador: 'D001',
      email: 'docente@unach.mx',
      grupo: 'Docente',
      materia: 'Programación Avanzada',
      laboratorio: 'Laboratorio 1',
      hora_ingreso: new Date().toISOString(),
      tipo: 'docente',
      foto_perfil: '/default-avatar.png'
    }
  ],
  reportes: [
    {
      id_reporte: 1,
      titulo: 'Reporte Semanal - Programación Avanzada',
      docente: 'Dr. Juan Pérez',
      materia: 'Programación Avanzada',
      grupo: 'ISC-8A',
      periodo: 'semanal',
      fecha_generacion: '2024-01-15',
      tipo: 'asistencia',
      estado: 'completado',
      archivo: 'reporte_semanal_prog_avanzada_isc8a.pdf',
      resumen: '85% de asistencia, 3 inasistencias justificadas'
    },
    {
      id_reporte: 2,
      titulo: 'Reporte Mensual - Bases de Datos',
      docente: 'Dra. Ana Martínez',
      materia: 'Bases de Datos',
      grupo: 'ISC-8B',
      periodo: 'mensual',
      fecha_generacion: '2024-01-10',
      tipo: 'rendimiento',
      estado: 'completado',
      archivo: 'reporte_mensual_bd_isc8b.pdf',
      resumen: 'Promedio grupal: 8.5, 2 alumnos con bajo rendimiento'
    },
    {
      id_reporte: 3,
      titulo: 'Reporte Anual - Laboratorio 1',
      docente: 'Mtro. Roberto Sánchez',
      materia: 'Redes de Computadoras',
      grupo: 'ISC-8A',
      periodo: 'anual',
      fecha_generacion: '2024-01-05',
      tipo: 'uso_laboratorio',
      estado: 'completado',
      archivo: 'reporte_anual_lab1_2024.pdf',
      resumen: '92% de uso efectivo, 15 mantenimientos realizados'
    },
    {
      id_reporte: 4,
      titulo: 'Reporte Semanal - Inteligencia Artificial',
      docente: 'Dra. Ana Martínez',
      materia: 'Inteligencia Artificial',
      grupo: 'ISC-8A',
      periodo: 'semanal',
      fecha_generacion: '2024-01-14',
      tipo: 'asistencia',
      estado: 'pendiente',
      archivo: null,
      resumen: 'En proceso de generación...'
    },
    {
      id_reporte: 5,
      titulo: 'Reporte Mensual - Laboratorio 2',
      docente: 'Dr. Juan Pérez',
      materia: 'Programación Avanzada',
      grupo: 'ISC-8B',
      periodo: 'mensual',
      fecha_generacion: '2024-01-08',
      tipo: 'uso_laboratorio',
      estado: 'completado',
      archivo: 'reporte_mensual_lab2_enero.pdf',
      resumen: '78% de ocupación, 4 eventos especiales realizados'
    }
  ]
};

const DashboardAdmin = ({ userData, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('asistencias');
  const [laboratorios, setLaboratorios] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [materias, setMaterias] = useState([]);
  const [clases, setClases] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  // --- ¡AÑADE ESTA LÍNEA! ---
  const [error, setError] = useState(null); // Para manejar errores
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [orden, setOrden] = useState('a-z');
  const [filtroMateria, setFiltroMateria] = useState('todos');
  // ¡CAMBIO! Guarda el ID del docente, no el nombre
  const [filtroDocenteId, setFiltroDocenteId] = useState('todos');
  // --- ¡NUEVO ESTADO PARA LISTA DE DOCENTES! ---
  const [listaDocentes, setListaDocentes] = useState([]); 
// - 
// ------------------------------------
  const [listaGrupos, setListaGrupos] = useState([]); // Antes 'listaNombresGrupos'
  // Filtros para reportes
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  
  const [periodoReporteAdmin, setPeriodoReporteAdmin] = useState('semana');
  const [grupoReporteAdmin, setGrupoReporteAdmin] = useState(''); // Guarda el NOMBRE del grupo
  // --- ¡AÑADE ESTE ESTADO NUEVO! ---
  const [periodoReporteGeneral, setPeriodoReporteGeneral] = useState('semana');
  // ---------------------------------
  // Estados para formularios
  const [showFormMateria, setShowFormMateria] = useState(false);
  const [showFormUsuario, setShowFormUsuario] = useState(false);
  const [showFormClase, setShowFormClase] = useState(false);
  const [editingMateria, setEditingMateria] = useState(null);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [editingClase, setEditingClase] = useState(null);

  const [listaHorarios, setListaHorarios] = useState([]);
  const [listaLaboratorios, setListaLaboratorios] = useState([]);
  const [showFormLaboratorio, setShowFormLaboratorio] = useState(false);
  const [editingLaboratorio, setEditingLaboratorio] = useState(null);
  // Renombraremos la lista completa de laboratorios para evitar confusión
  const [todosLaboratorios, setTodosLaboratorios] = useState([]);
  const [listaCarreras, setListaCarreras] = useState([]); // Para el dropdown de carreras
  // --- ¡AÑADE ESTOS DOS ESTADOS! ---
  // Para el dropdown del formulario de horarios
  const [listaMaterias, setListaMaterias] = useState([]); 
  // Para la tabla principal de esta pestaña
  const [plantillasHorarios, setPlantillasHorarios] = useState([]); 
  // --- ¡AÑADE ESTOS ESTADOS! ---
  const [showFormHorario, setShowFormHorario] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  // -----------------------------
  // ---------------------------------
  // --- ¡AÑADE ESTE ESTADO NUEVO! ---
  const [metricas, setMetricas] = useState({
    laboratorios: 0,
    usuarios: 0,
    asistenciasHoy: 0,
    reportes: 0
  });

 const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      switch(activeMenu) {
        case 'laboratorios':
          const labsResponse = await api.get('/laboratorios');
          setTodosLaboratorios(labsResponse.data); 
          break;
        
        // ¡ASEGÚRATE QUE SOLO HAYA UN case 'materias': !
        // --- ¡CAMBIO AQUÍ! ---
        case 'horarios': // <-- Renombrado (antes 'materias')
          // (Los filtros de materia/docente ya no aplican aquí, los quitamos)
          const horariosResponse = await api.get('/horarios'); // <-- Llama a /api/horarios
          setPlantillasHorarios(horariosResponse.data); // <-- Guarda en el nuevo estado
          break;
        // ---------------------

        case 'clases':
          const clasesResponse = await api.get('/clases');
          setClases(clasesResponse.data); 
          break;
          
        case 'usuarios':
          // Usa 'usuarioParams'
          const usuarioParams = new URLSearchParams(); 
          if (filtroRol !== 'todos') usuarioParams.append('rol', filtroRol);
          if (filtroGrupo !== 'todos') usuarioParams.append('grupo', filtroGrupo);
          if (orden !== 'a-z') usuarioParams.append('orden', orden); 
          
          const response = await api.get(`/usuarios?${usuarioParams.toString()}`); 
          setUsuarios(response.data); 
          break;
          
        case 'asistencias':
          const asistenciasResponse = await api.get('/asistencias/hoy'); 
          setAsistenciasHoy(asistenciasResponse.data); 
          break;
          
        case 'reportes':
          const reporteParams = new URLSearchParams();
          if (filtroTipo !== 'todos') reporteParams.append('tipo', filtroTipo);
          // ¡CAMBIO! Envía el filtro de periodo
          if (filtroPeriodo !== 'todos') reporteParams.append('periodo', filtroPeriodo); 
          // if (filtroEstado !== 'todos') ...

          const reportesResponse = await api.get(`/reportes?${reporteParams.toString()}`);
          setReportes(reportesResponse.data); 
          break;
                  
        default:
          const defaultAsistenciasResponse = await api.get('/asistencias/hoy');
          setAsistenciasHoy(defaultAsistenciasResponse.data);
          break;
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        onLogout(); 
      } else {
        alert("Error al cargar los datos.");
      }
    }
      setLoading(false);
  // ¡Asegúrate de incluir filtroMateria en las dependencias!
 }, [activeMenu, filtroRol, filtroGrupo, orden, filtroMateria, filtroDocenteId, filtroTipo, filtroPeriodo, onLogout]); // Añadidos filtroDocenteId y filtroTipo

useEffect(() => {
    cargarDatos(); 
  }, [cargarDatos]); // <-- La ÚNICA dependencia es la función cargarDatos optimizada
  // ------------------------------------
  // --- useEffect para Cargar Listas (Grupos Y DOCENTES) ---
// --- useEffect Inicial (carga listas para filtros/forms) ---
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargamos grupos, docentes Y MATERIAS en paralelo
        const [gruposRes, docentesRes, materiasRes , metricasRes] = await Promise.all([
           api.get('/grupos/nombres'),
           api.get('/docentes/nombres'),
           api.get('/materias'), // <-- ¡LLAMADA NUEVA!
           api.get('/admin/metricas')
        ]);
        setListaGrupos(gruposRes.data); // <-- Guarda el array de objetos
        setListaDocentes(docentesRes.data); 
        setListaMaterias(materiasRes.data); // <-- ¡GUARDA LA LISTA DE MATERIAS!
        setMetricas(metricasRes.data);
      } catch (err) {
        console.error("Error al cargar datos iniciales (grupos/docentes/materias):", err);
      }
    };
    cargarDatosIniciales(); 
  }, []); // El array vacío [] asegura que se ejecute solo una vez
  // -----------------------------------------------------------------



  

  // --- MÉTRICAS (¡CONECTADAS AL ESTADO REAL!) ---
  const metricsData = [
    { title: 'Laboratorios', value: metricas.laboratorios.toString(), icon: '🖥️' },
    { title: 'Usuarios', value: metricas.usuarios.toString(), icon: '👥' }, 
    { title: 'Asistencias Hoy', value: metricas.asistenciasHoy.toString(), icon: '✅' }, 
    { title: 'Reportes', value: metricas.reportes.toString(), icon: '📊' } 
  ];

// --- ¡NUEVA FUNCIÓN PARA GENERAR REPORTE (ADMIN)! ---
  const handleGenerarReporteGrupo = async () => {
    // Validación
    if (!grupoReporteAdmin || grupoReporteAdmin === 'todos') {
      alert('Por favor, selecciona un grupo válido para generar el reporte.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Llama al endpoint del backend con el NOMBRE del grupo y el periodo
      const response = await api.post('/reportes/generar-asistencia-grupo', { 
        periodo: periodoReporteAdmin,
        nombreGrupo: grupoReporteAdmin 
      });
      
      setLoading(false);
      alert(response.data.msg || 'Reporte generado exitosamente.'); 
      
      // Recarga la lista de reportes para mostrar el nuevo
      cargarDatos(); // Asumiendo que activeMenu sigue siendo 'reportes'

    } catch (err) {
      setLoading(false);
      console.error("Error al generar reporte por grupo:", err);
      if (err.response?.data?.msg) {
        alert(`❌ Error al generar reporte: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error de conexión al generar reporte.");
      }
    }
  };
  // --------------------------------------------------

  // --- ¡NUEVA FUNCIÓN PARA REPORTE GENERAL (ADMIN)! ---
  const handleGenerarReporteGeneral = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Llama al endpoint del backend con el periodo seleccionado
      const response = await api.post('/reportes/generar-general', { 
        periodo: periodoReporteGeneral
      });
      
      setLoading(false);
      alert(response.data.msg || 'Reporte General generado exitosamente.'); 
      
      // Recarga la lista de reportes
      cargarDatos(); 

    } catch (err) {
      setLoading(false);
      console.error("Error al generar reporte general:", err);
      if (err.response?.data?.msg) {
        alert(`❌ Error al generar reporte: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error de conexión al generar reporte.");
      }
    }
  };
  // ----------------------------------------------------
const handleEditar = async (tipo, id) => {
    if (tipo === 'usuario') {
      // 1. Encontramos el usuario completo en nuestra lista
      const usuario = usuarios.find(u => u.id_usuario === id);
      if (usuario) {
        // 2. Lo ponemos en el estado 'editingUsuario'
        setEditingUsuario(usuario); 
        // 3. Abrimos el modal (el formulario se llenará solo)
        setShowFormUsuario(true); 
      }
    } else if (tipo === 'clase') {
      setLoading(true);
      try {
        // 1. Buscamos los datos de LA clase a editar
        //    (Podríamos hacer un GET /api/clases/:id, pero por ahora la buscamos en la lista)
        const claseAEditar = clases.find(c => c.id_clase === id);
        if (!claseAEditar) throw new Error("Clase no encontrada en la lista actual.");

        // 2. Cargamos las listas para los dropdowns (igual que en handleAgregar)
        const [horariosRes, labsRes] = await Promise.all([
          api.get('/horarios'),
          api.get('/laboratorios') 
        ]);
        
        // 3. Guardamos las listas en el estado
        setListaHorarios(horariosRes.data);
        setListaLaboratorios(labsRes.data); // Cargamos TODOS los labs para editar

        // 4. Ponemos la clase a editar en el estado y abrimos el modal
        setEditingClase(claseAEditar); 
        setShowFormClase(true);
        
      } catch (err) {
        console.error("Error al preparar formulario de edición de clase:", err);
        alert("Error al cargar los datos para el formulario.");
      }
      setLoading(false);
    // -----------------------------

    } else if (tipo === 'materia') {
      // (Tu lógica de materia)
    } else {
      alert(`📝 Editando ${tipo} con ID: ${id} (Función simulada)`);
    }
  };


  
const handleEliminar = async (tipo, id) => {
    
    // --- Lógica para USUARIO ---
    if (tipo === 'usuario') {
      
      // 1. Pedimos confirmación
      const nombreUsuario = usuarios.find(u => u.id_usuario === id)?.nombre || 'este usuario';
      if (!window.confirm(`¿Estás seguro de eliminar a ${nombreUsuario}? Esta acción no se puede deshacer.`)) {
        return;
      }

      setLoading(true);
      try {
        // 2. Llamamos al endpoint de usuarios
        const response = await api.delete(`/usuarios/${id}`);
        // 3. Éxito
        setLoading(false);
        alert(response.data.msg); // Muestra "Usuario eliminado..."
        // 4. Recargamos
        cargarDatos(); 
      } catch (err) {
        // 5. Error
        setLoading(false);
        console.error("Error al eliminar usuario:", err);
        if (err.response && err.response.data && err.response.data.msg) {
          alert(`❌ Error: ${err.response.data.msg}`); 
        } else {
          alert("❌ Error al conectar con el servidor.");
        }
      }

    // --- Lógica para CLASE ---
    } else if (tipo === 'clase') {
      
      // 1. Pedimos confirmación
      const nombreClase = clases.find(c => c.id_clase === id)?.nombre_materia || 'esta clase';
      if (!window.confirm(`¿Estás seguro de eliminar (cancelar) ${nombreClase}?`)) {
        return;
      }

      setLoading(true);
      try {
        // 2. Llamamos al endpoint de clases
        const response = await api.delete(`/clases/${id}`);
        // 3. Éxito
        setLoading(false);
        alert(response.data.msg); // Muestra "Clase eliminada..."
        // 4. Recargamos
        cargarDatos(); 
      } catch (err) {
        // 5. Error
        setLoading(false);
        console.error("Error al eliminar clase:", err);
        if (err.response && err.response.data && err.response.data.msg) {
          alert(`❌ Error: ${err.response.data.msg}`); 
        } else {
          alert("❌ Error al conectar con el servidor.");
        }
      }

    // --- Lógica para otros tipos ---
    } else {
      alert(`Función de eliminar para '${tipo}' no implementada.`);
    }
  };

const handleAgregar = async (tipo) => { // <-- ¡AÑADE 'async' AQUÍ!
    if (tipo === 'usuario') {
      // (Tu lógica de usuario)
      setEditingUsuario(null); 
      setShowFormUsuario(true);
    
    // --- ¡REEMPLAZA ESTE BLOQUE! ---
    } else if (tipo === 'clase') {
      setLoading(true);
      try {
        // 1. Cargamos las listas para los dropdowns
        const [horariosRes, labsRes] = await Promise.all([
          api.get('/horarios'),
          api.get('/laboratorios') 
        ]);
        
        // 2. Guardamos las listas en el estado
        setListaHorarios(horariosRes.data);
        setListaLaboratorios(labsRes.data.filter(lab => lab.estado === 'disponible')); // Solo labs disponibles

        // 3. Preparamos el formulario (modo 'Crear')
        setEditingClase(null);
        setShowFormClase(true);
        
      } catch (err) {
        console.error("Error al preparar formulario de clase:", err);
        alert("Error al cargar los datos para el formulario.");
      }
      setLoading(false);
    // -----------------------------

    } else if (tipo === 'materia') {
      // (Tu lógica de materia)
    } else {
      alert(`➕ Agregando nuevo ${tipo} (Función simulada)`);
    }
  };

  // --- FUNCIONES CRUD PARA PLANTILLAS DE HORARIOS ---

  const handleAgregarHorario = () => {
    // Ya cargamos las listas (materias, docentes, grupos) al inicio
    setEditingHorario(null);
    setShowFormHorario(true);
  };

  const handleEditarHorario = (horario) => {
    // El 'horario' que recibimos de la tabla tiene nombres, no IDs.
    // El formulario (FormularioHorario) se encarga de encontrar los IDs correctos
    // basados en los nombres y las listas que cargamos (listaMaterias, listaDocentes, etc.)
    setEditingHorario(horario); 
    setShowFormHorario(true);
  };

  const handleEliminarHorario = async (id_horario) => {
    if (!window.confirm('¿Estás seguro de desactivar esta plantilla de horario? (Las clases ya programadas no se verán afectadas)')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/horarios/${id_horario}`);
      setLoading(false);
      alert('Plantilla de horario desactivada.');
      cargarDatos(); // Recarga la tabla
    } catch (err) {
      setLoading(false);
      console.error("Error al eliminar horario:", err);
      alert(`❌ Error: ${err.response?.data?.msg || 'Error de conexión.'}`);
    }
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const datosHorario = Object.fromEntries(formData.entries());

    // Convertimos los IDs a números
    datosHorario.id_materia = parseInt(datosHorario.id_materia);
    datosHorario.id_docente = parseInt(datosHorario.id_docente);
    datosHorario.id_grupo = parseInt(datosHorario.id_grupo); // ¡OJO con la nota de grupos!

    try {
      let response;
      if (editingHorario) {
        // --- ACTUALIZAR (PUT) ---
        // Añadimos 'activo: true' por si acaso, aunque el modelo ya lo asume
        datosHorario.activo = true; 
        response = await api.put(`/horarios/${editingHorario.id_horario}`, datosHorario);
      } else {
        // --- CREAR (POST) ---
        response = await api.post('/horarios', datosHorario);
      }

      setLoading(false);
      setShowFormHorario(false);
      setEditingHorario(null);
      alert(response.data.msg); // "Plantilla creada/actualizada..."
      cargarDatos(); // Recarga la tabla

    } catch (err) {
      setLoading(false);
      console.error("Error al guardar horario:", err);
      alert(`❌ Error: ${err.response?.data?.msg || 'Error de conexión.'}`);
    }
  };
  // -------------------------------------------------
  // --- ¡NUEVAS FUNCIONES CRUD PARA MATERIAS! ---
  const handleAgregarMateria = async () => {
    // Podríamos cargar la lista de carreras aquí si es necesario
    // Por ahora, solo abrimos el form vacío
    setEditingMateria(null);
    setShowFormMateria(true);
  };

  const handleEditarMateria = (mat) => {
    // Podríamos cargar la lista de carreras aquí también
    setEditingMateria(mat);
    setShowFormMateria(true);
  };

  const handleEliminarMateria = async (id) => {
    const nombreMat = materias.find(m => m.id_materia === id)?.nombre || 'esta materia';
    if (!window.confirm(`¿Estás seguro de eliminar ${nombreMat}?`)) return;

    setLoading(true);
    try {
      const response = await api.delete(`/materias/${id}`);
      setLoading(false);
      alert(response.data.msg);
      cargarDatos(); // Recarga la lista
    } catch (err) {
      setLoading(false);
      console.error("Error al eliminar materia:", err);
      if (err.response && err.response.data && err.response.data.msg) {
        alert(`❌ Error: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error al conectar con el servidor.");
      }
    }
  };

  const handleGuardarMateria = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const datosMat = Object.fromEntries(formData.entries());

    // Convertimos a número los campos necesarios
    datosMat.creditos = parseInt(datosMat.creditos) || 0;
    datosMat.semestre_recomendado = parseInt(datosMat.semestre_recomendado) || null;
    datosMat.id_carrera = parseInt(datosMat.id_carrera) || null;

    try {
      let response;
      if (editingMateria) {
        response = await api.put(`/materias/${editingMateria.id_materia}`, datosMat);
      } else {
        response = await api.post('/materias', datosMat);
      }
      setLoading(false);
      setShowFormMateria(false);
      setEditingMateria(null);
      alert(response.data.msg);
      cargarDatos(); // Recarga la lista
    } catch (err) {
      setLoading(false);
      console.error("Error al guardar materia:", err);
       if (err.response && err.response.data && err.response.data.msg) {
        alert(`❌ Error: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error al conectar con el servidor.");
      }
    }
  };

  // --- FUNCIÓN Descargar Reporte (Admin - PDF con AXIOS) ---
  const handleDescargarReporte = async (reporte) => { // <-- async
    console.log("Admin: Intentando descargar PDF con Axios:", reporte); 
    if (reporte.id_reporte && reporte.datos_reportados) { 
      // ¡Usa la ruta de Admin!
      const downloadUrl = `/reportes/${reporte.id_reporte}/download`; 
      
      setLoading(true); 
      try {
        console.log("Admin: Llamando a api.get con responseType: 'blob'");
        const response = await api.get(downloadUrl, {
          responseType: 'blob', // Pide el PDF como archivo binario
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        
        // Nombre del archivo PDF
        let filename = `reporte_${reporte.tipo}_${reporte.id_reporte}.pdf`; 
        const disposition = response.headers['content-disposition'];
         if (disposition?.includes('attachment')) { 
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches?.[1]) { 
              filename = matches[1].replace(/['"]/g, '');
            }
        }
        link.setAttribute('download', filename); 
        
        document.body.appendChild(link);
        link.click(); 
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log("Admin: Descarga PDF iniciada para:", filename);
        setLoading(false);

      } catch (err) {
        setLoading(false);
        console.error("Admin: Error al descargar el archivo PDF:", err);
         if (err.response?.status === 404) {
             alert('❌ Error: Reporte no encontrado o sin datos para generar PDF.');
         } else if (err.response?.status === 403) {
             alert('❌ Error: No tienes permiso para descargar este reporte.');
         } else {
             try {
                 const errorData = JSON.parse(await err.response.data.text());
                 alert(`❌ Error al descargar: ${errorData.msg || 'Error desconocido.'}`);
             } catch (parseError){
                 alert('❌ Ocurrió un error al intentar descargar el PDF.');
             }
         }
      }
    } else {
      console.log("Admin: Falta id_reporte o datos_reportados para descarga PDF."); 
      alert('⚠️ Este reporte no tiene datos para generar el PDF.');
    }
  };
  // --------------------------------------------------------

  // --- FUNCIÓN Ver Reporte (Admin - Muestra JSON) ---
  const handleVerReporte = (reporte) => {
    console.log("Admin: Intentando ver reporte:", reporte); 
    if (reporte.datos_reportados) {
      console.log("Admin: Datos encontrados, mostrando alert."); 
      const resumenFormateado = JSON.stringify(reporte.datos_reportados, null, 2); 
      // Mostramos el JSON en un alert simple por ahora
      alert(`Resumen del Reporte (Admin):\n--------------------\n${reporte.descripcion}\n--------------------\n${resumenFormateado}`);
    } else {
      console.log("Admin: No se encontraron datos_reportados."); 
      alert('Los detalles (datos JSON) de este reporte no están disponibles.');
    }
  };
  // ---------------------------------------------------

  const handleSolicitarReporte = () => {
    alert('📋 Función para solicitar nuevo reporte (en desarrollo)');
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    // 1. Recolectar los datos del formulario (esto no cambia)
    const formData = new FormData(e.target);
    const datosUsuario = Object.fromEntries(formData.entries());

    try {
      let response;
      
      // 2. ¡AQUÍ ESTÁ LA LÓGICA!
      if (editingUsuario) {
        // --- ES UNA ACTUALIZACIÓN (PUT) ---
        // El backend no actualiza rol ni contraseña desde este form
        response = await api.put(`/usuarios/${editingUsuario.id_usuario}`, datosUsuario);
      } else {
        // --- ES UNA CREACIÓN (POST) ---
        // El backend generará la contraseña
        response = await api.post('/usuarios', datosUsuario);
      }

      // 3. Si todo salió bien (para AMBOS casos)
      setLoading(false);
      setShowFormUsuario(false); // Cierra el modal
      setEditingUsuario(null); // Limpia el estado de edición
      alert(response.data.msg); // Muestra "Usuario creado..." o "Usuario actualizado..."
      
      // 4. Recargamos la lista de usuarios
      cargarDatos(); 

    } catch (err) {
      // 5. Si el backend da un error (ej. "Email ya existe")
      setLoading(false);
      console.error("Error al guardar usuario:", err);
      if (err.response && err.response.data && err.response.data.msg) {
        alert(`❌ Error: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error al conectar con el servidor.");
      }
    }
  };

  // --- ¡NUEVA FUNCIÓN PARA GUARDAR CLASES! ---
  const handleGuardarClase = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const datosClase = Object.fromEntries(formData.entries());

    // El backend espera 'id_horario' y 'id_laboratorio'
    // También necesita 'estado' y 'tema_clase' (opcional)

    try {
      let response;
      if (editingClase) {
        // --- Lógica de ACTUALIZAR (PUT) ---
        response = await api.put(`/clases/${editingClase.id_clase}`, datosClase);
      } else {
        // --- Lógica de CREAR (POST) ---
        response = await api.post('/clases', datosClase);
      }

      // 3. Éxito
      setLoading(false);
      setShowFormClase(false);
      setEditingClase(null);
      alert(response.data.msg); // "Clase programada..."
      
      // 4. Recargamos la lista de clases
      cargarDatos(); 

    } catch (err) {
      // 5. Error
      setLoading(false);
      console.error("Error al guardar clase:", err);
      if (err.response && err.response.data && err.response.data.msg) {
        alert(`❌ Error: ${err.response.data.msg}`); 
      } else {
        alert("❌ Error al conectar con el servidor.");
      }
    }
  };

  // --- ¡NUEVAS FUNCIONES CRUD PARA LABORATORIOS! ---
  const handleAgregarLaboratorio = () => {
    setEditingLaboratorio(null);
    setShowFormLaboratorio(true);
  };

  const handleEditarLaboratorio = (lab) => {
    setEditingLaboratorio(lab);
    setShowFormLaboratorio(true);
  };

  const handleEliminarLaboratorio = async (id) => {
    const nombreLab = todosLaboratorios.find(l => l.id_laboratorio === id)?.nombre || 'este laboratorio';
    if (!window.confirm(`¿Estás seguro de eliminar ${nombreLab}?`)) return;

    setLoading(true);
    try {
      const response = await api.delete(`/laboratorios/${id}`);
      setLoading(false);
      alert(response.data.msg);
      cargarDatos(); // Recarga la lista
    } catch (err) {
      // ... (manejo de error) ...
      setLoading(false);
    }
  };

  const handleGuardarLaboratorio = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const datosLab = Object.fromEntries(formData.entries());

    try {
      let response;
      if (editingLaboratorio) {
        response = await api.put(`/laboratorios/${editingLaboratorio.id_laboratorio}`, datosLab);
      } else {
        response = await api.post('/laboratorios', datosLab);
      }
      setLoading(false);
      setShowFormLaboratorio(false);
      setEditingLaboratorio(null);
      alert(response.data.msg);
      cargarDatos(); // Recarga la lista
    } catch (err) {
      // ... (manejo de error) ...
      setLoading(false);
    }
  };
  // ... (tus otros formularios) ...

  // --- FORMULARIO DE MATERIA ACTUALIZADO ---
  const FormularioMateria = () => (
    <div className="form-modal-overlay">
      <div className="form-modal">
        <div className="form-header">
          <h3>{editingMateria ? 'Editar Materia' : 'Agregar Nueva Materia'}</h3>
          <button className="btn-cerrar" onClick={() => setShowFormMateria(false)}>✕</button>
        </div>
        {/* ¡CAMBIO! Conecta onSubmit */}
        <form className="form-body" onSubmit={handleGuardarMateria}> 
          <div className="form-group">
            <label>Nombre:</label>
            <input type="text" name="nombre" defaultValue={editingMateria?.nombre || ''} required />
          </div>
          <div className="form-group">
            <label>Clave:</label>
            <input type="text" name="clave" defaultValue={editingMateria?.clave || ''} required />
          </div>
          <div className="form-group">
            <label>Créditos:</label>
            <input type="number" name="creditos" defaultValue={editingMateria?.creditos || 5} required min="1"/>
          </div>
          {/* (Opcional: Dropdown de Carreras - Necesitaría un endpoint /api/carreras) */}
          <div className="form-group">
             <label>ID Carrera (Opcional):</label> 
             <input type="number" name="id_carrera" defaultValue={editingMateria?.id_carrera || ''} placeholder="Ej: 1"/>
          </div>
          <div className="form-group">
            <label>Semestre Recomendado (Opcional):</label>
            <input type="number" name="semestre_recomendado" defaultValue={editingMateria?.semestre_recomendado || ''} min="1" max="12"/>
          </div>
          <div className="form-group">
            <label>Descripción (Opcional):</label>
            <textarea name="descripcion" rows="3" defaultValue={editingMateria?.descripcion || ''}></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => setShowFormMateria(false)}>Cancelar</button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? 'Guardando...' : (editingMateria ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  // ---------------------------------------

// Formulario de Usuario (unificado para todos los roles)
  const FormularioUsuario = () => {
    // El rol se sigue seteando con 'useState' para el <select>
    const [rolSeleccionado, setRolSeleccionado] = useState(editingUsuario?.rol || 'alumno');

    return (
      <div className="form-modal-overlay">
        <div className="form-modal">
          <div className="form-header">
            <h3>{editingUsuario ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
            <button className="btn-cerrar" onClick={() => { setShowFormUsuario(false); setEditingUsuario(null); }}>✕</button>
          </div>

          <form className="form-body" onSubmit={handleGuardarUsuario}>
            
            <div className="form-group">
              <label>Nombre completo:</label>
              <input 
                type="text" 
                name="nombre"
                defaultValue={editingUsuario?.nombre || ''} // <-- Lee de 'editingUsuario'
                placeholder="Ingrese el nombre completo"
                required 
              />
            </div>
            <div className="form-group">
              <label>Correo electrónico:</label>
              <input 
                type="email" 
                name="email"
                defaultValue={editingUsuario?.email || ''} // <-- Lee de 'editingUsuario'
                placeholder="ejemplo@unach.mx"
                required 
              />
            </div>
            <div className="form-group">
              <label>Rol:</label>
              <select 
                name="rol"
                value={rolSeleccionado} 
                onChange={(e) => setRolSeleccionado(e.target.value)}
                disabled={editingUsuario} // <-- ¡CAMBIO! No se puede cambiar el rol al editar
              >
                <option value="alumno">Alumno</option>
                <option value="docente">Docente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            {/* Campos específicos para alumnos */}
            <div className="campos-alumno" style={{display: rolSeleccionado === 'alumno' ? 'block' : 'none'}}>
              <div className="form-group">
                <label>Matrícula:</label>
                <input 
                  type="text" 
                  name="matricula" 
                  // ¡CAMBIO! Leemos 'identificador' que es donde guardamos la matrícula
                  defaultValue={editingUsuario?.identificador || ''} 
                  placeholder="Ej: A001"
                />
              </div>
              <div className="form-group">
                <label>Grupo:</label>
                <input 
                  type="text" 
                  name="grupo"
                  defaultValue={editingUsuario?.grupo || ''} // <-- Lee de 'editingUsuario'
                  placeholder="Ej: LIDTS-7M"
                />
              </div>
            </div>

            {/* Campos específicos para docentes */}
            <div className="campos-docente" style={{display: rolSeleccionado === 'docente' ? 'block' : 'none'}}>
              <div className="form-group">
                <label>Número de empleado:</label>
                <input 
                  type="text" 
                  name="no_empleado"
                  // ¡CAMBIO! Leemos 'identificador' para el No. de empleado
                  defaultValue={editingUsuario?.identificador || ''} 
                  placeholder="Ej: D001"
                />
              </div>
              <div className="form-group">
                <label>Especialidad (opcional):</label>
                <input 
                  type="text" 
                  name="especialidad"
                  defaultValue={editingUsuario?.especialidad || ''} // (Este dato faltará por ahora)
                  placeholder="Ej: Redes y Base de Datos"
                />
              </div>
            </div>

            {/* Campos para administradores */}
            <div className="campos-admin" style={{display: rolSeleccionado === 'admin' ? 'block' : 'none'}}>
              <div className="form-group">
                <label>Puesto (opcional):</label>
                <input 
                  type="text" 
                  name="puesto"
                  // ¡CAMBIO! Leemos 'identificador' para el puesto
                  defaultValue={editingUsuario?.identificador || ''} 
                  placeholder="Ej: Coordinador de Labs"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-cancelar" onClick={() => { setShowFormUsuario(false); setEditingUsuario(null); }}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={loading}>
                {loading ? 'Guardando...' : (editingUsuario ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

// --- ¡FORMULARIO DE CLASE ACTUALIZADO! ---
  const FormularioClase = () => (
    <div className="form-modal-overlay">
      <div className="form-modal">
        <div className="form-header">
          <h3>{editingClase ? 'Editar Clase/Evento' : 'Agregar Nueva Clase/Evento'}</h3>
          <button className="btn-cerrar" onClick={() => setShowFormClase(false)}>✕</button>
        </div>

        {/* ¡CAMBIO! Conectamos el onSubmit */}
        <form className="form-body" onSubmit={handleGuardarClase}>
          
          {/* ¡CAMBIO! Dropdown de Horarios */}
          <div className="form-group">
            <label>Horario (Materia - Docente - Grupo):</label>
            <select 
              name="id_horario" // <-- El ID que espera el backend
              defaultValue={editingClase?.id_horario || ''}
              required
            >
              <option value="" disabled>Seleccione un horario...</option>
              {listaHorarios.map(h => (
                <option key={h.id_horario} value={h.id_horario}>
                  {/* Ej: "Redes (Lunes 7-9) - Mtro. Carlos - LIDTS-7M" */}
                  {`${h.nombre_materia} (${h.dias_semana} ${h.hora_inicio.substring(0,5)}-${h.hora_fin.substring(0,5)}) - ${h.nombre_docente} - ${h.nombre_grupo}`}
                </option>
              ))}
            </select>
          </div>
          
          {/* ¡CAMBIO! Dropdown de Laboratorios */}
          <div className="form-group">
            <label>Laboratorio (Solo disponibles):</label>
            <select 
              name="id_laboratorio" // <-- El ID que espera el backend
              defaultValue={editingClase?.id_laboratorio || ''}
              required
            >
              <option value="" disabled>Seleccione un laboratorio...</option>
              {listaLaboratorios.map(lab => (
                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>
                  {lab.nombre} (Cap: {lab.capacidad})
                </option>
              ))}
            </select>
          </div>
          
          {/* ¡CAMBIO! Inputs para Fecha y Hora */}
          <div className="form-row">
            <div className="form-group">
              <label>Fecha:</label>
              <input 
                type="date" 
                name="fecha" // <-- Nombre para el backend
                defaultValue={editingClase?.fecha ? new Date(editingClase.fecha).toISOString().split('T')[0] : ''} 
                required
              />
            </div>
            <div className="form-group">
              <label>Hora inicio:</label>
              <input 
                type="time" 
                name="hora_inicio" // <-- Nombre para el backend
                defaultValue={editingClase?.hora_inicio || ''} 
                required
              />
            </div>
            <div className="form-group">
              <label>Hora fin:</label>
              <input 
                type="time" 
                name="hora_fin" // <-- Nombre para el backend
                defaultValue={editingClase?.hora_fin || ''} 
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Estado:</label>
            <select name="estado" defaultValue={editingClase?.estado || 'programada'}>
              <option value="programada">Programada</option>
              <option value="en_curso">En Curso</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Tema/Actividad (Opcional):</label>
            <input 
              type="text" 
              name="tema_clase" // <-- Nombre para el backend
              defaultValue={editingClase?.tema_clase || ''} 
              placeholder="Ej: Examen Parcial 1"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => setShowFormClase(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? 'Guardando...' : (editingClase ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // --- ¡NUEVO FORMULARIO PARA LABORATORIOS! ---
  const FormularioLaboratorio = () => (
    <div className="form-modal-overlay">
      <div className="form-modal">
        <div className="form-header">
          <h3>{editingLaboratorio ? 'Editar Laboratorio' : 'Agregar Nuevo Laboratorio'}</h3>
          <button className="btn-cerrar" onClick={() => setShowFormLaboratorio(false)}>✕</button>
        </div>
        <form className="form-body" onSubmit={handleGuardarLaboratorio}>
          <div className="form-group">
            <label>Nombre:</label>
            <input type="text" name="nombre" defaultValue={editingLaboratorio?.nombre || ''} required />
          </div>
          <div className="form-group">
            <label>Ubicación:</label>
            <input type="text" name="ubicacion" defaultValue={editingLaboratorio?.ubicacion || ''} />
          </div>
          <div className="form-group">
            <label>Capacidad:</label>
            <input type="number" name="capacidad" defaultValue={editingLaboratorio?.capacidad || 20} required min="1"/>
          </div>
          <div className="form-group">
            <label>Equipamiento:</label>
            <textarea name="equipamiento" rows="3" defaultValue={editingLaboratorio?.equipamiento || ''}></textarea>
          </div>
          <div className="form-group">
            <label>Estado:</label>
            <select name="estado" defaultValue={editingLaboratorio?.estado || 'disponible'}>
              <option value="disponible">Disponible</option>
              <option value="ocupado">Ocupado</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => setShowFormLaboratorio(false)}>Cancelar</button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? 'Guardando...' : (editingLaboratorio ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  const renderAsistencias = () => (
    <div className="asistencias-section">
      <div className="section-header">
        <h2>Asistencias del Día ({asistenciasHoy.length})</h2>
        <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando asistencias...</div>
      ) : asistenciasHoy.length === 0 ? (
        <div className="no-data">
          <h3>📭 No hay asistencias registradas hoy</h3>
          <p>Las asistencias aparecerán cuando los alumnos y docentes escaneen sus QR.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Foto</th><th>Nombre</th><th>Identificador</th><th>Email</th><th>Grupo/Tipo</th><th>Materia</th><th>Laboratorio</th><th>Hora Ingreso</th><th>Tipo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {/* Map over the real asistenciasHoy data */}
              {asistenciasHoy.map(asistencia => (
                <tr key={`${asistencia.tipo}-${asistencia.id_asistencia}`}> {/* Use unique key */}
                  <td>
                    <img 
                      src={asistencia.foto_perfil || '/default-avatar.png'} 
                      alt="Foto" 
                      className="foto-tabla"
                    />
                  </td>
                  <td>{asistencia.nombre_persona}</td>
                  <td>{asistencia.identificador}</td>
                  <td>{asistencia.email}</td>
                  <td>
                    {/* Use grupo_tipo which is consistent */}
                    <span className={`badge ${asistencia.tipo}`}> 
                      {asistencia.grupo_tipo}
                    </span>
                  </td>
                  <td>{asistencia.nombre_materia}</td>
                  <td>{asistencia.nombre_laboratorio}</td>
                  <td>{new Date(asistencia.hora_ingreso).toLocaleTimeString('es-MX')}</td>
                  <td>
                    <span className={`badge ${asistencia.tipo}`}>
                      {asistencia.tipo}
                    </span>
                  </td>
                  <td> {/* Display attendance status */}
                    <span className={`badge estado-${asistencia.estado || 'presente'}`}>
                      {asistencia.estado || 'presente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // --- ¡NUEVO FORMULARIO PARA PLANTILLAS DE HORARIOS! ---
  const FormularioHorario = () => {
    // Busca los nombres de las listas que ya cargamos
    const materiaDefault = listaMaterias.find(m => m.nombre === editingHorario?.nombre_materia)?.id_materia || '';
    const docenteDefault = listaDocentes.find(d => d.nombre === editingHorario?.nombre_docente)?.id_docente || '';
  const grupoDefault = listaGrupos.find(g => g.nombre === editingHorario?.nombre_grupo)?.id_grupo || '';
    return (
      <div className="form-modal-overlay">
        <div className="form-modal">
          <div className="form-header">
            <h3>{editingHorario ? 'Editar Plantilla de Horario' : 'Asignar Nuevo Horario'}</h3>
            <button className="btn-cerrar" onClick={() => setShowFormHorario(false)}>✕</button>
          </div>
          
          {/* Llama a handleGuardarHorario al enviar */}
          <form className="form-body" onSubmit={handleGuardarHorario}>
            
            <div className="form-group">
              <label>Materia:</label>
              <select name="id_materia" defaultValue={materiaDefault} required>
                <option value="" disabled>Selecciona una materia...</option>
                {listaMaterias.map(m => (
                  <option key={m.id_materia} value={m.id_materia}>{m.nombre} ({m.clave})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Docente:</label>
              <select name="id_docente" defaultValue={docenteDefault} required>
                <option value="" disabled>Selecciona un docente...</option>
                {listaDocentes.map(d => (
                  <option key={d.id_docente} value={d.id_docente}>{d.nombre}</option>
                ))}
              </select>
            </div>

            {/* --- ¡DROPDOWN GRUPO CORREGIDO! --- */}
            <div className="form-group">
              <label>Grupo:</label>
              <select name="id_grupo" defaultValue={grupoDefault} required>
                <option value="" disabled>Selecciona un grupo...</option>
                {/* Ahora usa la lista de objetos 'listaGrupos' */}
                {listaGrupos.map((grupo) => (
                  <option key={grupo.id_grupo} value={grupo.id_grupo}> 
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Día de la Semana:</label>
              <select name="dias_semana" defaultValue={editingHorario?.dias_semana || ''} required>
                <option value="" disabled>Selecciona un día...</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hora Inicio:</label>
                <input type="time" name="hora_inicio" defaultValue={editingHorario?.hora_inicio || ''} required />
              </div>
              <div className="form-group">
                <label>Hora Fin:</label>
                <input type="time" name="hora_fin" defaultValue={editingHorario?.hora_fin || ''} required />
              </div>
            </div>

             <div className="form-group">
                <label>Periodo (Opcional):</label>
                <input type="text" name="periodo" defaultValue={editingHorario?.periodo || ''} placeholder="Ej: 2025-2026/1"/>
             </div>

            <div className="form-actions">
              <button type="button" className="btn-cancelar" onClick={() => setShowFormHorario(false)}>Cancelar</button>
              <button type="submit" className="btn-guardar" disabled={loading}>
                {loading ? 'Guardando...' : (editingHorario ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // ---------------------------------------------------

  const renderUsuarios = () => (
    <div className="usuarios-section">
      <div className="section-header">
        <h2>Gestión de Usuarios ({usuarios.length})</h2>
        <div className="header-actions">
          <button className="btn-agregar" onClick={() => handleAgregar('usuario')}>
            ➕ Agregar Usuario
          </button>
          <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-group">
          <label>Filtrar por rol:</label>
          <select 
            value={filtroRol} 
            onChange={(e) => setFiltroRol(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="docente">Docentes</option>
            <option value="alumno">Alumnos</option>
          </select>
        </div>

       <div className="filtro-group">
          <label>Filtrar por grupo:</label>
          <select Access-Control-Request-Headers value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="filtro-select">
            <option value="todos">Todos los grupos</option>
            {/* Usa 'listaGrupos' (objetos) pero el 'value' es el NOMBRE */}
            {listaGrupos.map(grupo => (
              <option key={grupo.id_grupo} value={grupo.nombre}> 
                {grupo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Ordenar por:</label>
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="filtro-select"
          >
            <option value="a-z">A - Z</option>
            <option value="z-a">Z - A</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="no-data">No hay usuarios registrados</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Información</th>
                <th>Grupo/Materias</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id_usuario}>
                  <td>
                    <img 
                      src={user.foto_perfil || '/default-avatar.png'} 
                      alt="Foto" 
                      className="foto-tabla"
                    />
                  </td>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.rol}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td>{user.identificador || 'N/A'}</td>
                  <td>
                    {user.rol === 'alumno' ? (
                      user.grupo || 'N/A'
                    ) : user.rol === 'docente' ? (
                      <div className="lista-items">
                        {user.materias?.map((materia, index) => (
                          <span key={index} className="item-tag">{materia}</span>
                        ))}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <button className="btn-editar" onClick={() => handleEditar('usuario', user.id_usuario)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminar('usuario', user.id_usuario)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFormUsuario && <FormularioUsuario />}
    </div>
  );

  // --- ¡FUNCIÓN RENDERLABORATORIOS ACTUALIZADA! ---
  const renderLaboratorios = () => (
    <div className="laboratorios-section">
      <div className="section-header">
        {/* Usamos todosLaboratorios para el contador */}
        <h2>Laboratorios ({todosLaboratorios.length})</h2> 
        {/* Botón Agregar ya conectado */}
        <button className="btn-agregar" onClick={handleAgregarLaboratorio}> 
          ➕ Agregar Laboratorio
        </button>
        <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>
      </div>
      
      {/* Usamos todosLaboratorios para la condición de carga */}
      {loading ? ( 
        <div className="loading">Cargando laboratorios...</div>
      ) : todosLaboratorios.length === 0 ? ( 
        <div className="no-data">No hay laboratorios registrados</div>
      ) : (
        <div className="laboratorios-grid">
          {/* Usamos todosLaboratorios para iterar y mostrar las tarjetas */}
          {todosLaboratorios.map(lab => ( 
            <div key={lab.id_laboratorio} className="laboratorio-card">
              <h3>{lab.nombre}</h3>
              <div className="lab-info">
                <span className={`estado ${lab.estado}`}>
                  {lab.estado?.charAt(0)?.toUpperCase() + lab.estado?.slice(1) || 'Desconocido'}
                </span>
                <div className="lab-details">
                  <span><strong>Ubicación:</strong> {lab.ubicacion || 'No especificada'}</span>
                  <span><strong>Capacidad:</strong> {lab.capacidad} personas</span>
                  <span><strong>Equipamiento:</strong> {lab.equipamiento || 'No especificado'}</span>
                </div>
              </div>
              <div className="card-actions">
                 {/* ¡BOTONES EDITAR Y ELIMINAR CONECTADOS! */}
                <button className="btn-editar" onClick={() => handleEditarLaboratorio(lab)}>Editar</button>
                <button className="btn-eliminar" onClick={() => handleEliminarLaboratorio(lab.id_laboratorio)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Muestra el formulario cuando showFormLaboratorio es true */}
      {showFormLaboratorio && <FormularioLaboratorio />} 
    </div>
  );

  // --- ¡NUEVA FUNCIÓN renderHorarios! (Reemplaza a renderMaterias) ---
  const renderHorarios = () => {
    // (Aún no hemos conectado las funciones handleAgregarHorario, etc.)
    
    return (
    <div className="materias-section"> {/* Reusa el estilo si quieres */}
      <div className="section-header">
        <h2>Gestión de Horarios ({plantillasHorarios.length})</h2> 
        <div className="header-actions">
          {/* Este botón abrirá el nuevo formulario (aún no conectado) */}
          <button className="btn-agregar" onClick={handleAgregarHorario}> 
            ➕ Asignar Nuevo Horario
          </button>
          <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* (Aquí irían los filtros para la tabla de horarios) */}
      
      {loading ? ( 
        <div className="loading">Cargando plantillas de horarios...</div> 
      ) : plantillasHorarios.length === 0 ? ( 
        <div className="no-data">No hay plantillas de horarios creadas.</div> 
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Docente</th>
                <th>Grupo</th>
                <th>Día</th>
                <th>Horario</th>
                <th>Periodo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plantillasHorarios.map(horario => ( 
                <tr key={horario.id_horario}>
                  <td>{horario.nombre_materia}</td>
                  <td>{horario.nombre_docente}</td>
                  <td>{horario.nombre_grupo}</td>
                  <td>{horario.dias_semana}</td>
                  <td>{`${horario.hora_inicio.substring(0,5)} - ${horario.hora_fin.substring(0,5)}`}</td>
                  <td>{horario.periodo || 'N/A'}</td>
                  <td>
                    <button className="btn-editar" onClick={() => handleEditarHorario(horario)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminarHorario(horario.id_horario)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ¡Muestra el modal si showFormHorario es true! */}
      {showFormHorario && <FormularioHorario />}
    </div>
  )};
  // ---------------------------------------------------
  // ... (tu renderLaboratorios, renderMaterias, etc.) ...

  // --- ¡FUNCIÓN RENDERCLASES ACTUALIZADA! ---
  const renderClases = () => (
    <div className="clases-section">
      <div className="section-header">
        <h2>Clases y Eventos ({clases.length})</h2> {/* ¡CAMBIO! Usa 'clases.length' */}
        <div className="header-actions">
          <button className="btn-agregar" onClick={() => handleAgregar('clase')}>
            ➕ Agregar Clase/Evento
          </button>
          <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando clases...</div>
      ) : clases.length === 0 ? (
        <div className="no-data">No hay clases o eventos programados</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Materia/Actividad</th>
                <th>Responsable</th>
                <th>Laboratorio</th>
                <th>Grupo</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* ¡CAMBIO! Iteramos sobre 'clases' (los datos reales) */}
              {clases.map(clase => (
                <tr key={clase.id_clase}>
                  {/* Usamos los nombres de columna de la consulta SQL */}
                  <td>{clase.tema_clase || clase.nombre_materia}</td>
                  <td>{clase.nombre_docente}</td>
                  <td>{clase.nombre_laboratorio}</td>
                  <td>{clase.nombre_grupo}</td>
                  <td>{new Date(clase.fecha).toLocaleDateString('es-ES')}</td>
                  <td>{`${clase.hora_inicio.substring(0, 5)} - ${clase.hora_fin.substring(0, 5)}`}</td>
                  <td>
                    <span className={`badge estado-${clase.estado}`}>
                      {clase.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn-editar" onClick={() => handleEditar('clase', clase.id_clase)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminar('clase', clase.id_clase)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFormClase && <FormularioClase />}
    </div>
  );


  const renderReportes = () => {
  return (
    <div className="reportes-section">
      <div className="section-header">
        <h2>Reportes Generados ({reportes.length})</h2> 
        <div className="header-actions">
          <button className="btn-refresh" onClick={cargarDatos} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Filtros para la tabla - CORREGIDOS */}
      <div className="filtros-container">
        <div className="filtro-group">
          <label>Periodo:</label>
          <select 
            value={filtroPeriodo} 
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="filtro-select" // ¡AÑADE ESTA CLASE!
          >
            <option value="todos">Todos los periodos</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div className="filtro-group">
          <label>Tipo de reporte:</label>
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select" // ¡AÑADE ESTA CLASE!
          >
            <option value="todos">Todos los tipos</option>
            <option value="grupo">Por Grupo</option>
            <option value="docente">Por Docente</option>
            <option value="alumno">Por Alumno</option>
            <option value="clase">Por Clase</option>
            <option value="mensual">Mensual (General)</option>
          </select>
        </div>
      </div>

      {/* Sección para Generar Reporte por Grupo */}
      <div className="reportes-grid" style={{marginBottom: '20px'}}>
        <div className="reporte-card">
          <h3>📊 Generar Reporte de Asistencia por Grupo</h3>
          <p>Selecciona un grupo y un periodo para generar un nuevo reporte.</p>
          
          <div className="reporte-options">
            <select 
               className="filtro-select" // ¡CAMBIA A filtro-select!
               value={periodoReporteAdmin} 
               onChange={(e) => setPeriodoReporteAdmin(e.target.value)}
            >
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>

            <select 
              className="filtro-select" // ¡CAMBIA A filtro-select!
              value={grupoReporteAdmin} 
              onChange={(e) => setGrupoReporteAdmin(e.target.value)} 
              required
            >
              <option value="" disabled>Selecciona un grupo...</option>
              {listaGrupos.map(grupo => (
                <option key={grupo.id_grupo} value={grupo.nombre}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <button 
             className="btn-generar-reporte"
             onClick={handleGenerarReporteGrupo}
             disabled={loading || !grupoReporteAdmin}
          >
            {loading ? 'Generando...' : 'Generar Reporte por Grupo'}
          </button>
        </div>
       
        <div className="reporte-card">
          <h3>🌍 Generar Reporte General</h3>
          <p>Calcula estadísticas de asistencia de **todas** las clases en el sistema.</p>
          
          <div className="reporte-options">
            <select 
               className="filtro-select" // ¡CAMBIA A filtro-select!
               value={periodoReporteGeneral} 
               onChange={(e) => setPeriodoReporteGeneral(e.target.value)}
            >
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
          </div>
          
          <button 
             className="btn-generar-reporte"
             onClick={handleGenerarReporteGeneral}
             disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Reporte General'}
          </button>
        </div>
      </div>

      {/* Tabla de Reportes Existentes */}
      <h3>Reportes Anteriores</h3>
      {loading && reportes.length === 0 ? ( 
        <div className="loading">Cargando reportes...</div> 
      ) : !loading && reportes.length === 0 ? ( 
        <div className="no-data info-card">
          <h3>No hay reportes que coincidan con los filtros</h3>
        </div>
       ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Fecha Generación</th>
                <th>Rango Fechas</th>
                <th>Generado Por</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map(reporte => (
                <tr key={reporte.id_reporte}>
                  <td><strong>{reporte.descripcion || 'Sin descripción'}</strong></td>
                  <td>
                    <span className={`badge tipo-${reporte.tipo}`}>
                      {reporte.tipo}
                    </span>
                  </td>
                  <td>{new Date(reporte.fecha_generacion).toLocaleString('es-MX')}</td>
                  <td>
                    {reporte.rango_fecha_inicio && reporte.rango_fecha_fin 
                      ? `${new Date(reporte.rango_fecha_inicio).toLocaleDateString('es-ES')} - ${new Date(reporte.rango_fecha_fin).toLocaleDateString('es-ES')}`
                      : 'N/A'}
                  </td>
                  <td>{reporte.generado_por_username || 'Sistema'}</td>
                  <td>{reporte.nombre_archivo || 'No generado'}</td>
                  <td>
                    <div className="acciones-reporte">
                      <button 
                        className="btn-ver" 
                        onClick={() => handleVerReporte(reporte)} 
                        title="Ver resumen JSON"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-descargar" 
                        onClick={() => handleDescargarReporte(reporte)} 
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
};

  const renderContent = () => {
    switch(activeMenu) {
      case 'asistencias':
        return renderAsistencias();
      case 'laboratorios':
        return renderLaboratorios();
      // --- ¡CAMBIO AQUÍ! ---
      case 'horarios': // <-- Renombrado (antes 'materias')
        return renderHorarios(); // <-- Llama a la nueva función (que crearemos)
      // ---------------------
      case 'clases':
        return renderClases();
      case 'reportes':
        return renderReportes();
      case 'usuarios':
        return renderUsuarios();
      default:
        return renderAsistencias();
    }
  };

  return (
    <div className="dashboard-admin">
      <header className="admin-header">
        <div className="header-left">
          <div className="logo">
            <span>UNACH</span>
          </div>
          <h1>Panel de Administración - SISLAB</h1>
        </div>
        <div className="header-right">
          <span className="user-info">Usuario: {userData?.username || 'admin'}</span>
          <button onClick={onLogout} className="logout-btn">🚪 Cerrar sesión</button>
        </div>
      </header>

      <div className="admin-container">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <div className={`nav-item ${activeMenu === 'asistencias' ? 'active' : ''}`}
              onClick={() => setActiveMenu('asistencias')}>
              ✅ Asistencias del Día
            </div>
            <div className={`nav-item ${activeMenu === 'laboratorios' ? 'active' : ''}`}
              onClick={() => setActiveMenu('laboratorios')}>
              🖥️ Laboratorios
            </div>
            <div className={`nav-item ${activeMenu === 'horarios' ? 'active' : ''}`}
                 onClick={() => setActiveMenu('horarios')}>
              📚 Horarios y Materias
            </div>
            <div className={`nav-item ${activeMenu === 'clases' ? 'active' : ''}`}
              onClick={() => setActiveMenu('clases')}>
              📅 Clases y Eventos
            </div>
            <div className={`nav-item ${activeMenu === 'reportes' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reportes')}>
              📊 Reportes
            </div>
            <div className={`nav-item ${activeMenu === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveMenu('usuarios')}>
              👥 Gestión de Usuarios
            </div>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="metrics-grid">
            {metricsData.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-content">
                  <h3>{metric.title}</h3>
                  <div className="metric-value">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="content-area">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;