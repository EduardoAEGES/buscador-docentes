const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOAtzCK7kEKL_NaeHfOFczW4YswgOmLqxVT1B_luq6HAwg4pELhT3bB93ky3lqHw/pub?gid=1579919371&single=true&output=csv";
const URL_HORARIO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQB9TpfaUwVf8iaaDnrkL79XKE7WBjGDkwoQguRhSV7dg50-0kSpTejMi8KW5P_AAMzi5APt4NP-p6y/pub?gid=1657026679&single=true&output=csv";

let data = [];
let scheduleData = [];

// Cargar ambos CSVs al iniciar
Promise.all([
  fetch(URL_CSV).then(r => r.text()),
  fetch(URL_HORARIO).then(r => r.text())
]).then(([mainCsv, scheduleCsv]) => {
  parseMainData(mainCsv);
  parseScheduleData(scheduleCsv);
});

function parseMainData(csv) {
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    complete: res => {
      data = res.data.map(r => {
        const contractKey = Object.keys(r).find(k => k.toUpperCase().includes("CONTRATO"));
        return {
          dni: r["DNI"]?.trim(),
          nombre: r["APELLIDOS Y NOMBRES"]?.trim(),
          estado: r["STATUS"]?.trim(),
          contrato: r[contractKey]?.trim(),
          sede: r["SEDE"]?.trim(),
          disponibilidad: r["DISPONIBILIDAD"]?.trim(),
          observaciones: r["OBSERVACION"]?.trim(),
          diagnostico: r["DIAGNOSTICO"]?.trim(),
          linea: r["LINEA"]?.trim()
        };
      });
    }
  });
}

function parseScheduleData(csv) {
  // El CSV de horario tiene basura en las primeras 3 líneas.
  // Buscamos la línea que empieza con los encabezados reales (ej. contiene "DNI" y "NOMBRES")
  const lines = csv.split("\n");
  const headerIndex = lines.findIndex(l => l.includes("DNI") && l.includes("NOMBRES"));

  if (headerIndex === -1) {
    console.error("No se encontraron cabeceras en el CSV de horario");
    return;
  }

  // Unir desde la línea de cabecera hacia abajo
  const cleanCsv = lines.slice(headerIndex).join("\n");

  Papa.parse(cleanCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    complete: res => {
      scheduleData = res.data;
      console.log("Horario cargado:", scheduleData.length, "registros");
    }
  });
}

// Normalizar texto para búsquedas
function normalizar(t) {
  return (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Dar formato de DNI
function formatearDNI(dni) {
  if (!dni) return "—";
  return dni.length === 7 ? "0" + dni : dni;
}


// Buscar por nombre
function filtrar() {
  const q = normalizar(document.getElementById("buscador").value);
  const ul = document.getElementById("lista");
  ul.innerHTML = "";

  if (q.length < 2) return;

  const resultados = data
    .filter(r => normalizar(r.nombre).includes(q))
    .slice(0, 15);

  resultados.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r.nombre;
    li.style.cursor = "pointer";
    li.onclick = () => mostrarDetalle(r);
    ul.appendChild(li);
  });
}

// Mostrar detalle
function mostrarDetalle(r) {
  document.getElementById("d-nombre").textContent = r.nombre || "—";
  document.getElementById("d-dni").textContent = r.dni?.padStart(8, "0") || "—";

  const estadoEl = document.getElementById("d-estado");
  const estadoTexto = (r.estado || "").trim().toUpperCase();

  estadoEl.textContent = estadoTexto;

  // limpiar clases previas
  estadoEl.className = "estado";

  // mapear estados a clases CSS
  if (estadoTexto === "VIGENTE") {
    estadoEl.classList.add("vigente");
  } else if (estadoTexto === "OBSERVADO") {
    estadoEl.classList.add("observado");
  } else if (estadoTexto === "DESVINCULADO") {
    estadoEl.classList.add("desvinculado");
  }

  // Actualizar buscador con el nombre seleccionado
  document.getElementById("buscador").value = r.nombre || "";
  // Opcional: Limpiar la lista para que no estorbe
  document.getElementById("lista").innerHTML = "";

  const lineaEl = document.getElementById("d-linea");
  const lineaTexto = (r.linea || "").trim(); // Mantener original casing o upper? User dijo "CONTABILIDAD"

  lineaEl.textContent = lineaTexto || "—";

  // Resetear clases base
  lineaEl.className = "linea-badge";

  // Lógica de colores para Linea
  const upperLinea = lineaTexto.toUpperCase();
  if (upperLinea.includes("CONTABILIDAD")) {
    lineaEl.classList.add("linea-contabilidad");
  } else if (upperLinea.includes("PENSAMIENTO LOGICO") || upperLinea.includes("PENSAMIENTO LÓGICO")) {
    lineaEl.classList.add("linea-logico");
  }

  document.getElementById("d-contrato").textContent = r.contrato || "—";
  document.getElementById("d-sede").textContent = r.sede || "—";
  document.getElementById("d-disponibilidad").textContent = r.disponibilidad || "—";
  document.getElementById("d-observaciones").textContent = r.observaciones || "—";
  document.getElementById("d-observaciones").textContent = r.observaciones || "—";
  document.getElementById("d-diagnostico").textContent = r.diagnostico || "—";

  // Reset collapsible state
  const collapsibleHeader = document.querySelector(".collapsible-header");
  const collapsibleContent = document.querySelector(".collapsible-content");
  if (collapsibleHeader && collapsibleContent) {
    collapsibleHeader.classList.remove("active");
    collapsibleContent.style.maxHeight = null;
  }

  // Renderizar horario
  // renderSchedule(r.dni, r.nombre); NO renderizar automáticamente


  // Validar si tiene horario (DNI existe en el archivo de horario)
  const existeEnHorario = scheduleData.some(h => h["DNI"] === r.dni);
  const btnHorario = document.getElementById("btn-ver-horario");
  const legend = document.getElementById("schedule-legend");
  const container = document.getElementById("schedule-container");
  const mobileContainer = document.getElementById("schedule-mobile-container");

  // Reset UI features
  container.innerHTML = "";
  container.style.display = "none";
  if (mobileContainer) mobileContainer.innerHTML = "";

  legend.style.display = "none";

  if (existeEnHorario) {
    btnHorario.disabled = false;
    btnHorario.innerHTML = '<i class="ph ph-calendar-blank"></i> Ver Horario';
    btnHorario.onclick = () => openSchedule(r.dni, r.nombre);
  } else {
    btnHorario.disabled = true;
    btnHorario.innerHTML = '<i class="ph ph-link-break"></i> DOCENTE NO VINCULADO';
    btnHorario.onclick = null;
  }
}

function openSchedule(dni, nombre) {
  const modal = document.getElementById("schedule-modal");
  const modalTitle = document.getElementById("modal-teacher-name");
  const btnPdf = document.getElementById("btn-download-pdf");

  modalTitle.textContent = "Horario: " + nombre;

  // Guardar datos actuales para el PDF
  window.currentScheduleDni = dni;
  window.currentScheduleName = nombre;

  // Renderizar y verificar si tiene carga
  const tieneCarga = renderSchedule(dni, nombre);
  const container = document.getElementById("schedule-container");

  if (tieneCarga) {
    btnPdf.style.display = "inline-flex";
    document.getElementById("schedule-legend").style.display = "flex";
    container.style.display = "block"; // Asegurar que sea visible
  } else {
    btnPdf.style.display = "none";
    document.getElementById("schedule-legend").style.display = "none";
    container.style.display = "block"; // También mostrar para el msj de "Sin carga"
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSchedule(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById("schedule-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function getCellClass(text) {
  if (!text) return "";
  const t = text.toUpperCase();
  if (t.includes("VIRTUAL")) return "bg-virtual";
  if (t.includes("ADELANTO")) return "bg-adelanto";
  if (t.includes("ATE")) return "bg-ate";
  if (t.includes("VES")) return "bg-ves";
  if (t.includes("CAL")) return "bg-cal";
  if (t.includes("NOR")) return "bg-nor";
  if (t.includes("CIX")) return "bg-cix";
  if (t.includes("AQP")) return "bg-aqp";
  if (t.includes("PRC")) return "bg-prc";
  if (t.includes("ASINCRONO") || t.includes("ASÍNCRONO")) return "bg-asincrono";
  return "";
}

function renderSchedule(dni, nombre) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  if (!dni) return false;

  // Filtrar horario por DNI
  const horarioDocente = scheduleData.filter(h => h["DNI"] === dni);

  // Verificar si tiene alguna clase asignada (alguna celda de días con contenido)
  const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
  const tieneContenido = horarioDocente.some(row => {
    return dias.some(dia => row[dia] && row[dia].trim().length > 0);
  });

  if (!tieneContenido) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <i class="ph ph-calendar-x" style="font-size: 48px; color: var(--text-label); margin-bottom: 10px;"></i>
        <p style="font-size: 16px; font-weight: 500; color: var(--primary);">SIN CARGA HORARIA ASIGNADA</p>
        <p style="font-size: 13px; color: var(--text-label);">El docente figura en el sistema pero no tiene cursos programados.</p>
      </div>
    `;
    return false;
  }

  // Crear tabla
  const table = document.createElement("table");
  table.className = "schedule-table";

  // Cabecera
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Hora</th>
      <th>Lunes</th>
      <th>Martes</th>
      <th>Miércoles</th>
      <th>Jueves</th>
      <th>Viernes</th>
      <th>Sábado</th>
      <th>Domingo</th>
    </tr>
  `;
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement("tbody");

  // Ordenar por hora de inicio si es posible (asumiendo formato HH:MM)
  // El CSV tiene col "Hora Inicio" (col index 4 aprox, pero usaremos nombre)
  // "Hora Inicio"

  horarioDocente.forEach(row => {
    // Si la fila está vacía en todos los días, saltarla? No, puede ser hueco.
    // Pero si ya validamos tieneContenido global, mostramos todo lo que haya.

    const tr = document.createElement("tr");

    const horaInicio = row["Hora Inicio"] || "";
    const horaFin = row["Hora Fin"] || "";
    const rangoHoras = `${horaInicio} - ${horaFin}`;

    tr.innerHTML = `
      <td style="font-weight: 500; color: var(--primary); white-space: nowrap;">${rangoHoras}</td>
      <td class="${getCellClass(row["LUNES"])}">${row["LUNES"] || ""}</td>
      <td class="${getCellClass(row["MARTES"])}">${row["MARTES"] || ""}</td>
      <td class="${getCellClass(row["MIERCOLES"])}">${row["MIERCOLES"] || ""}</td>
      <td class="${getCellClass(row["JUEVES"])}">${row["JUEVES"] || ""}</td>
      <td class="${getCellClass(row["VIERNES"])}">${row["VIERNES"] || ""}</td>
      <td class="${getCellClass(row["SABADO"])}">${row["SABADO"] || ""}</td>
      <td class="${getCellClass(row["DOMINGO"])}">${row["DOMINGO"] || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // --- RENDER MOBILE VIEW ---
  const mobileContainer = document.getElementById("schedule-mobile-container");
  mobileContainer.innerHTML = "";

  const diasMap = {
    "LUNES": "LUNES",
    "MARTES": "MARTES",
    "MIERCOLES": "MIÉRCOLES",
    "JUEVES": "JUEVES",
    "VIERNES": "VIERNES",
    "SABADO": "SÁBADO",
    "DOMINGO": "DOMINGO"
  };

  Object.keys(diasMap).forEach(diaKey => {
    // Filtrar clases para este día
    const clasesDia = horarioDocente.filter(row => row[diaKey] && row[diaKey].trim().length > 0);

    if (clasesDia.length > 0) {
      const dayGroup = document.createElement("div");
      dayGroup.className = "mobile-day-group";

      const dayHeader = document.createElement("div");
      dayHeader.className = "mobile-day-header";
      dayHeader.textContent = diasMap[diaKey];
      dayGroup.appendChild(dayHeader);

      clasesDia.forEach(row => {
        const horaInicio = row["Hora Inicio"] || "";
        const horaFin = row["Hora Fin"] || "";
        const curso = row[diaKey];
        const cellClass = getCellClass(curso);

        const card = document.createElement("div");
        card.className = "mobile-class-card";

        // Use inline style for background if needed, or just class on badge
        // card.style.backgroundColor = ... (optional, maybe too colorful) 

        card.innerHTML = `
          <div class="mobile-time"><i class="ph ph-clock"></i> ${horaInicio} - ${horaFin}</div>
          <div class="mobile-subject">${curso}</div>
          <div style="margin-top: 4px;">
            <span class="mobile-subject-badge ${cellClass}">${curso}</span>
          </div>
        `;
        // Clean up: duplicated subject text. Let's remove the plain text if we use badge, or vice versa.
        // Let's use just the badge for the subject + color.
        card.innerHTML = `
            <div class="mobile-time"><i class="ph ph-clock"></i> ${horaInicio} - ${horaFin}</div>
            <span class="mobile-subject-badge ${cellClass}" style="width: fit-content;">${curso}</span>
        `;

        dayGroup.appendChild(card);
      });

      mobileContainer.appendChild(dayGroup);
    }
  });

  return true;
}

// Función para descargar PDF
function downloadSchedulePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

  const dni = window.currentScheduleDni;
  const nombre = window.currentScheduleName;

  if (!dni) return;

  const horarioDocente = scheduleData.filter(h => h["DNI"] === dni);

  // Título
  doc.setFontSize(16);
  doc.text(`Horario: ${nombre}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`DNI: ${dni}`, 14, 28);
  doc.text(`Fecha de descarga: ${new Date().toLocaleDateString()}`, 14, 34);

  // Preparar datos para autoTable
  const head = [['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']];
  const body = horarioDocente.map(row => {
    const hora = `${row["Hora Inicio"] || ""} - ${row["Hora Fin"] || ""}`;
    return [
      hora,
      row["LUNES"] || "",
      row["MARTES"] || "",
      row["MIERCOLES"] || "",
      row["JUEVES"] || "",
      row["VIERNES"] || "",
      row["SABADO"] || "",
      row["DOMINGO"] || ""
    ];
  });

  // Generar tabla
  doc.autoTable({
    startY: 40,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    styles: { fontSize: 8, cellPadding: 2 },
    didParseCell: function (data) {
      // Colorear celdas según contenido
      if (data.section === 'body' && data.column.index > 0) {
        const text = data.cell.raw;
        if (text) {
          const t = text.toUpperCase();
          // Colores aproximados a los CSS
          if (t.includes("VIRTUAL")) data.cell.styles.fillColor = [169, 209, 142];
          else if (t.includes("ADELANTO")) data.cell.styles.fillColor = [255, 242, 204];
          else if (t.includes("ATE")) data.cell.styles.fillColor = [244, 176, 132];
          else if (t.includes("VES")) data.cell.styles.fillColor = [155, 194, 230];
          else if (t.includes("CAL")) data.cell.styles.fillColor = [255, 199, 206];
          else if (t.includes("NOR")) data.cell.styles.fillColor = [255, 217, 102];
          else if (t.includes("CIX")) data.cell.styles.fillColor = [165, 165, 165];
          else if (t.includes("AQP")) data.cell.styles.fillColor = [180, 167, 214];
          else if (t.includes("PRC")) data.cell.styles.fillColor = [0, 255, 255];
          else if (t.includes("ASINCRONO")) {
            data.cell.styles.fillColor = [0, 0, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    }
  });

  doc.save(`Horario_${dni}.pdf`);
}

function toggleCollapsible(header) {
  header.classList.toggle("active");
  const content = header.nextElementSibling;

  if (content.style.maxHeight) {
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
  }
}
