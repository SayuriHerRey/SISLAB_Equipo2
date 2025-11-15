import PDFDocument from 'pdfkit';

// Función para generar un PDF simple con los datos del reporte de asistencia
export const generateAsistenciaPdfStream = (reporteData) => {
  const doc = new PDFDocument({ margin: 50 });

  // --- Cabecera ---
  doc
    .fontSize(18).text('Reporte de Asistencia', { align: 'center' })
    .moveDown(0.5);
  doc
    .fontSize(12).text(reporteData.descripcion || 'Descripción no disponible', { align: 'center' })
    .moveDown(0.5);
  doc
    .fontSize(10).text(`Generado el: ${new Date(reporteData.fecha_generacion).toLocaleString('es-MX')}`, { align: 'center' })
    .text(`Periodo: ${reporteData.rango_fecha_inicio} al ${reporteData.rango_fecha_fin}`, { align: 'center' })
    .moveDown(1.5);

  // --- Datos del Reporte (del JSONB) ---
  const stats = reporteData.datos_reportados; // Asume que datos_reportados es un objeto
  if (stats) {
    doc.fontSize(14).text('Resumen de Asistencia', { underline: true }).moveDown(0.5);
    doc.fontSize(12);
    doc.text(`- Clases Impartidas en Periodo: ${stats.totalClasesImpartidas || 'N/A'}`);
    doc.text(`- Total Asistencias Esperadas: ${stats.totalAsistenciasEsperadas || 'N/A'}`);
    doc.text(`- Total Asistencias Registradas: ${stats.totalAsistenciasRegistradas || 'N/A'}`);
    doc.moveDown(0.5);
    doc.text('Detalles:', { underline: true });
    doc.text(`  - Presentes: ${stats.detalles?.presentes ?? 'N/A'}`); // Usa optional chaining
    doc.text(`  - Tardanzas: ${stats.detalles?.tardanzas ?? 'N/A'}`);
    doc.text(`  - Ausentes (Calculado): ${stats.detalles?.ausentes ?? 'N/A'}`);
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Porcentaje de Asistencia: ${stats.porcentajeAsistencia || 0}%`, { align: 'right' });
    doc.moveDown(1);

    // --- Podríamos añadir más detalles si los tuviéramos ---
    // Por ejemplo, una tabla con la lista de clases o alumnos.
    // doc.text('Detalle por clase (Pendiente)...');

  } else {
    doc.fontSize(12).text('No hay datos de resumen disponibles en este reporte.');
  }

  // --- Pie de Página (Opcional) ---
  doc.fontSize(8).text('Sistema de Gestión de Laboratorios - SISLAB', 50, doc.page.height - 50, {
    align: 'center',
    lineBreak: false
  });

  // Finaliza el PDF (Importante)
  doc.end();

  return doc; // Devuelve el stream del documento PDF
};

/**
 * Genera un PDF con la lista de asistencia de una clase específica.
 */
export const generateClaseAsistenciaPdfStream = (claseInfo, asistencias) => {
  const doc = new PDFDocument({ margin: 50 });

  // --- Cabecera ---
  doc.fontSize(16).text('Lista de Asistencia - SISLAB', { align: 'center' });
  doc.fontSize(10).text(new Date().toLocaleString('es-MX'), { align: 'center' });
  doc.moveDown(1.5);

  // --- Información de la Clase ---
  doc.fontSize(12).text('Detalles de la Clase:', { underline: true }).moveDown(0.5);
  doc.text(`Materia: ${claseInfo.nombre_materia || 'N/A'}`);
  doc.text(`Docente: ${claseInfo.nombre_docente || 'N/A'}`);
  doc.text(`Grupo: ${claseInfo.nombre_grupo || 'N/A'}`);
  doc.text(`Laboratorio: ${claseInfo.nombre_laboratorio || 'N/A'}`);
  doc.text(`Fecha: ${new Date(claseInfo.fecha).toLocaleDateString('es-ES')}`);
  doc.text(`Horario: ${claseInfo.hora_inicio.substring(0,5)} - ${claseInfo.hora_fin.substring(0,5)}`);
  doc.moveDown(1.5);

  // --- Tabla de Asistencias ---
  doc.fontSize(12).text('Alumnos Registrados:', { underline: true }).moveDown(0.5);

  // Cabeceras de la tabla
  const tableTop = doc.y;
  const colNombre = 50;
  const colMatricula = 250;
  const colHora = 350;
  const colEstado = 450;

  doc.font('Helvetica-Bold');
  doc.text('Nombre', colNombre, tableTop);
  doc.text('Matrícula', colMatricula, tableTop);
  doc.text('Hora Ingreso', colHora, tableTop);
  doc.text('Estado', colEstado, tableTop, { width: 100, align: 'right' });
  doc.moveDown(1);
  doc.font('Helvetica');

  // Filas de la tabla
  asistencias.forEach(asistencia => {
    const y = doc.y;
    doc.text(asistencia.nombre_alumno, colNombre, y, { width: 190 }); // Ancho para nombre
    doc.text(asistencia.matricula, colMatricula, y, { width: 90 });
    doc.text(new Date(asistencia.hora_ingreso).toLocaleTimeString('es-MX'), colHora, y, { width: 90 });
    doc.text(asistencia.estado, colEstado, y, { width: 100, align: 'right' });
    doc.moveDown(0.5); // Espacio entre filas
  });

  doc.moveDown(1);
  doc.fontSize(10).text(`Total de alumnos registrados: ${asistencias.length}`, { align: 'right' });

  // --- Pie de Página ---
  doc.fontSize(8).text('Reporte generado automáticamente por SISLAB', 50, doc.page.height - 50, {
    align: 'center',
    lineBreak: false
  });

  doc.end();
  return doc; // Devuelve el stream del PDF
};