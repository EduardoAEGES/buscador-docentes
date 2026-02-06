const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOAtzCK7kEKL_NaeHfOFczW4YswgOmLqxVT1B_luq6HAwg4pELhT3bB93ky3lqHw/pub?gid=1579919371&single=true&output=csv";

let data = [];

fetch(URL_CSV)
  .then(r => r.text())
  .then(csv => {
    const filas = csv.split("\n").slice(1);
    data = filas.map(f => {
      const c = f.split(",");
      return {
        dni: c[1]?.trim(),
        nombre: c[2]?.trim(),
        estado: c[3]?.trim()
      };
    });
  });

function normalizar(t) {
  return t.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filtrar() {
  const q = normalizar(document.getElementById("buscador").value);
  const ul = document.getElementById("lista");
  ul.innerHTML = "";

  if (q.length < 2) return;

  data
    .filter(r => normalizar(r.nombre).includes(q))
    .slice(0, 15)
    .forEach(r => {
      const li = document.createElement("li");
      li.textContent = r.nombre;
      li.style.cursor = "pointer";
      li.onclick = () => mostrarDetalle(r);
      ul.appendChild(li);
    });
}

function mostrarDetalle(r) {
  document.getElementById("d-nombre").textContent = r.nombre;
  document.getElementById("d-dni").textContent = r.dni;
  document.getElementById("d-estado").textContent = r.estado;
}
