const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOAtzCK7kEKL_NaeHfOFczW4YswgOmLqxVT1B_luq6HAwg4pELhT3bB93ky3lqHw/pub?gid=1579919371&single=true&output=csv";

let data = [];

// Cargar y parsear el CSV correctamente
fetch(URL_CSV)
  .then(r => r.text())
  .then(csv => {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(), // 🔑 Limpiar espacios en cabeceras
      complete: res => {

         // 👇 PON ESTO AQUÍ
    console.log("CABECERAS DEL CSV:", res.meta.fields);
    console.log("PRIMERA FILA:", res.data[0]);

        data = res.data.map(r => {
          // Buscar dinámicamente la llave de contrato
          const contractKey = Object.keys(r).find(k => k.toUpperCase().includes("CONTRATO"));

          return {
            dni: r["DNI"]?.trim(),
            nombre: r["APELLIDOS Y NOMBRES"]?.trim(),
            estado: r["STATUS"]?.trim(),
            contrato: r[contractKey]?.trim(), // Usar la llave encontrada
            sede: r["SEDE"]?.trim(),
            disponibilidad: r["DISPONIBILIDAD"]?.trim(),
            observaciones: r["OBSERVACION"]?.trim(),
            diagnostico: r["DIAGNOSTICO"]?.trim(),
            linea: r["LINEA"]?.trim()
          };
        });
      }
    });
  });

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
  document.getElementById("d-diagnostico").textContent = r.diagnostico || "—";
}
