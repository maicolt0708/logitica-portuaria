"use strict";

// CONFIGURACIÓN

const ESTADOS = [
    "En puerto",
    "En tránsito",
    "Pendiente",
    "Entregado"
];

const EMPRESAS = [
    "Transportes Urabá",
    "Carga del Caribe",
    "Logística del Norte"
];

// Conserva la misma clave de las versiones anteriores.
const CLAVE_DATOS = "puertoUrabaAvanceV1";

const DATOS_INICIALES = [
    {
        codigo: "CONT-001",
        carga: "Banano",
        ubicacion: "Patio A",
        estado: "En puerto",
        transportista: "Transportes Urabá"
    },
    {
        codigo: "CONT-002",
        carga: "Café",
        ubicacion: "Ruta 01",
        estado: "En tránsito",
        transportista: "Carga del Caribe"
    },
    {
        codigo: "CONT-003",
        carga: "Maquinaria",
        ubicacion: "Bodega central",
        estado: "Entregado",
        transportista: "Logística del Norte"
    },
    {
        codigo: "CONT-004",
        carga: "Plátano",
        ubicacion: "Zona de revisión",
        estado: "Pendiente",
        transportista: "Transportes Urabá"
    },
    {
        codigo: "CONT-005",
        carga: "Textiles",
        ubicacion: "Patio B",
        estado: "En puerto",
        transportista: "Carga del Caribe"
    },
    {
        codigo: "CONT-006",
        carga: "Cacao",
        ubicacion: "Ruta 02",
        estado: "En tránsito",
        transportista: "Logística del Norte"
    }
];

let contenedores = DATOS_INICIALES.map(item => ({ ...item }));
let movimientos = [];
let temporizador;

// ELEMENTOS DEL DOCUMENTO

const obtener = id => document.getElementById(id);

const login = obtener("login");
const aplicacion = obtener("aplicacion");
const formLogin = obtener("form-login");
const usuario = obtener("usuario");
const contrasena = obtener("contrasena");
const botonVer = obtener("ver-contrasena");

const busqueda = obtener("busqueda");
const filtroEstado = obtener("filtro-estado");
const tabla = obtener("tabla-contenedores");

const modal = obtener("modal-contenedor");
const formContenedor = obtener("form-contenedor");

// RECUPERAR DATOS GUARDADOS

function cargarDatos() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_DATOS));

        if (!datos) return;

        const registrosValidos =
            Array.isArray(datos.contenedores) &&
            datos.contenedores.every(item =>
                item &&
                ["codigo", "carga", "ubicacion", "transportista"].every(
                    campo => typeof item[campo] === "string"
                ) &&
                /^CONT-[0-9]{3}$/.test(item.codigo) &&
                ESTADOS.includes(item.estado) &&
                EMPRESAS.includes(item.transportista)
            );

        const movimientosValidos =
            Array.isArray(datos.movimientos) &&
            datos.movimientos.every(item =>
                item &&
                typeof item.texto === "string" &&
                typeof item.fecha === "string"
            );

        const codigosUnicos = registrosValidos &&
            new Set(datos.contenedores.map(item => item.codigo)).size ===
            datos.contenedores.length;

        if (registrosValidos && movimientosValidos && codigosUnicos) {
            contenedores = datos.contenedores;
            movimientos = datos.movimientos;
        }
    } catch (error) {
        console.warn("No se pudieron recuperar los datos locales.");
    }
}

function guardarDatos() {
    try {
        localStorage.setItem(
            CLAVE_DATOS,
            JSON.stringify({
                contenedores,
                movimientos
            })
        );

        return true;
    } catch (error) {
        return false;
    }
}

// FUNCIONES DE APOYO

function escapar(valor) {
    const elemento = document.createElement("span");
    elemento.textContent = String(valor);

    return elemento.innerHTML
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function claseEstado(estado) {
    const clases = {
        "En puerto": "estado-puerto",
        "En tránsito": "estado-transito",
        "Pendiente": "estado-pendiente",
        "Entregado": "estado-entregado"
    };

    return clases[estado];
}

function contarEstado(estado) {
    return contenedores.filter(item => item.estado === estado).length;
}

function notificar(mensaje) {
    const notificacion = obtener("notificacion");

    clearTimeout(temporizador);

    notificacion.textContent = mensaje;
    notificacion.hidden = false;

    temporizador = setTimeout(() => {
        notificacion.hidden = true;
    }, 4500);
}

function registrarMovimiento(texto) {
    movimientos.unshift({
        texto,
        fecha: new Date().toLocaleString("es-CO")
    });
}

function informarGuardado(guardado, mensaje) {
    notificar(
        guardado
            ? mensaje
            : mensaje + " El navegador no permitió guardar el cambio al cerrar la página."
    );
}

// ESTADÍSTICAS E INICIO

function mostrarEstadisticas() {
    obtener("total-contenedores").textContent = contenedores.length;
    obtener("total-transito").textContent = contarEstado("En tránsito");
    obtener("total-pendientes").textContent = contarEstado("Pendiente");
}

function mostrarInicio() {
    const pendientes = contarEstado("Pendiente");
    const transito = contarEstado("En tránsito");

    obtener("aviso-pendientes").textContent =
        pendientes === 0
            ? "No hay contenedores pendientes en este momento."
            : `Hay ${pendientes} ${
                pendientes === 1
                    ? "contenedor pendiente"
                    : "contenedores pendientes"
              }. Revisa su información antes de continuar la operación.`;

    obtener("aviso-transito").textContent =
        transito === 0
            ? "Actualmente no hay cargas registradas en tránsito."
            : `Hay ${transito} ${
                transito === 1
                    ? "contenedor en tránsito"
                    : "contenedores en tránsito"
              }. Consulta sus datos desde el registro de contenedores.`;

    const ultimo = movimientos[0];

    obtener("ultima-actividad").textContent = ultimo
        ? `${ultimo.texto} · ${ultimo.fecha}`
        : "Todavía no se han registrado movimientos en el panel.";
}

// TABLA DE CONTENEDORES

function mostrarContenedores() {
    const texto = busqueda.value.trim().toLowerCase();
    const estado = filtroEstado.value;

    const resultados = contenedores.filter(item => {
        const coincideTexto = [
            item.codigo,
            item.carga,
            item.ubicacion
        ].some(valor => valor.toLowerCase().includes(texto));

        const coincideEstado = !estado || item.estado === estado;

        return coincideTexto && coincideEstado;
    });

    tabla.innerHTML = resultados.map(item => `
        <tr>
            <td>${escapar(item.codigo)}</td>
            <td>${escapar(item.carga)}</td>
            <td>${escapar(item.ubicacion)}</td>
            <td>${escapar(item.transportista)}</td>

            <td>
                <span class="insignia ${claseEstado(item.estado)}">
                    ${escapar(item.estado)}
                </span>
            </td>

            <td>
                <select
                    class="selector-estado"
                    data-codigo="${escapar(item.codigo)}"
                    aria-label="Cambiar estado de ${escapar(item.codigo)}"
                >
                    ${ESTADOS.map(opcion => `
                        <option
                            value="${opcion}"
                            ${opcion === item.estado ? "selected" : ""}
                        >
                            ${opcion}
                        </option>
                    `).join("")}
                </select>
            </td>
        </tr>
    `).join("");

    obtener("sin-resultados").hidden = resultados.length > 0;

    obtener("cantidad-resultados").textContent =
        `${resultados.length} de ${contenedores.length} contenedores`;
}

// TRANSPORTISTAS

function mostrarTransportistas() {
    obtener("lista-transportistas").innerHTML = EMPRESAS.map(empresa => {
        const cantidad = contenedores.filter(item =>
            item.transportista === empresa
        ).length;

        return `
            <article class="transportista">
                <div>
                    <h4>${escapar(empresa)}</h4>
                    <p>Transporte terrestre de carga · Empresa de ejemplo</p>
                </div>

                <span class="cantidad-empresa">
                    ${cantidad} ${
                        cantidad === 1 ? "contenedor" : "contenedores"
                    }
                </span>
            </article>
        `;
    }).join("");
}

// HISTORIAL

function mostrarMovimientos() {
    const lista = obtener("lista-movimientos");

    if (movimientos.length === 0) {
        lista.innerHTML = `
            <li>
                <p>No hay movimientos registrados.</p>
                <small>
                    Registra un contenedor o modifica su estado.
                </small>
            </li>
        `;
        return;
    }

    lista.innerHTML = movimientos.map(item => `
        <li>
            <p>${escapar(item.texto)}</p>
            <small>${escapar(item.fecha)}</small>
        </li>
    `).join("");
}

// REPORTES

function mostrarReportes() {
    obtener("grafico-reportes").innerHTML = ESTADOS.map(estado => {
        const cantidad = contarEstado(estado);

        const porcentaje = contenedores.length
            ? Math.round(cantidad / contenedores.length * 100)
            : 0;

        return `
            <div class="fila-reporte">
                <div class="etiqueta-reporte">
                    <span>${estado}</span>
                    <strong>${cantidad} · ${porcentaje}%</strong>
                </div>

                <div class="barra-fondo" aria-hidden="true">
                    <div class="barra" style="width: ${porcentaje}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function actualizarPantalla() {
    mostrarEstadisticas();
    mostrarInicio();
    mostrarContenedores();
    mostrarTransportistas();
    mostrarMovimientos();
    mostrarReportes();
}

// NAVEGACIÓN

const TITULOS = {
    inicio: "Inicio",
    contenedores: "Contenedores",
    transportistas: "Transportistas",
    movimientos: "Movimientos",
    reportes: "Reportes"
};

function cambiarVista(vista, enfocar = true) {
    if (!Object.prototype.hasOwnProperty.call(TITULOS, vista)) return;

    document.querySelectorAll(".vista").forEach(seccion => {
        seccion.hidden = seccion.id !== `vista-${vista}`;
    });

    document.querySelectorAll(".menu").forEach(boton => {
        const activo = boton.dataset.vista === vista;

        boton.classList.toggle("activo", activo);

        if (activo) {
            boton.setAttribute("aria-current", "page");
        } else {
            boton.removeAttribute("aria-current");
        }
    });

    obtener("titulo-vista").textContent = TITULOS[vista];
    obtener("ruta-actual").textContent = TITULOS[vista];

    if (enfocar && !aplicacion.hidden) {
        obtener("titulo-vista").focus();
    }
}

document.querySelectorAll(".menu").forEach(boton => {
    boton.addEventListener("click", () => {
        cambiarVista(boton.dataset.vista);
    });
});

document.querySelectorAll("[data-ir]").forEach(boton => {
    boton.addEventListener("click", () => {
        cambiarVista(boton.dataset.ir);
    });
});

document.querySelectorAll("[data-filtrar]").forEach(boton => {
    boton.addEventListener("click", () => {
        busqueda.value = "";
        filtroEstado.value = boton.dataset.filtrar;

        mostrarContenedores();
        cambiarVista("contenedores");
    });
});

// BÚSQUEDA Y FILTROS

busqueda.addEventListener("input", mostrarContenedores);
filtroEstado.addEventListener("change", mostrarContenedores);

obtener("limpiar-filtros").addEventListener("click", () => {
    busqueda.value = "";
    filtroEstado.value = "";

    mostrarContenedores();
    busqueda.focus();
});

// FORMULARIO DE CONTENEDORES

obtener("nuevo-contenedor").addEventListener("click", () => {
    formContenedor.reset();
    obtener("error-contenedor").textContent = "";

    modal.showModal();
    obtener("codigo").focus();
});

obtener("cerrar-modal").addEventListener("click", () => {
    modal.close();
});

formContenedor.addEventListener("submit", evento => {
    evento.preventDefault();

    const codigo = obtener("codigo").value.trim().toUpperCase();
    const carga = obtener("carga").value.trim();
    const ubicacion = obtener("ubicacion").value.trim();
    const transportista = obtener("transportista").value;
    const estado = obtener("estado").value;
    const error = obtener("error-contenedor");

    error.textContent = "";

    if (!/^CONT-[0-9]{3}$/.test(codigo)) {
        error.textContent = "El código debe tener un formato como CONT-007.";
        return;
    }

    if (!carga || !ubicacion) {
        error.textContent = "Completa la carga y la ubicación.";
        return;
    }

    if (!EMPRESAS.includes(transportista) || !ESTADOS.includes(estado)) {
        error.textContent = "Selecciona un transportista y un estado válidos.";
        return;
    }

    if (contenedores.some(item => item.codigo === codigo)) {
        error.textContent = "Ya existe un contenedor con ese código.";
        return;
    }

    contenedores.push({
        codigo,
        carga,
        ubicacion,
        transportista,
        estado
    });

    registrarMovimiento(
        `Se registró ${codigo} con estado ${estado}.`
    );

    const guardado = guardarDatos();

    busqueda.value = "";
    filtroEstado.value = "";

    actualizarPantalla();
    modal.close();

    informarGuardado(guardado, "Contenedor registrado correctamente.");
});

// CAMBIO DE ESTADO

tabla.addEventListener("change", evento => {
    const selector = evento.target;

    if (!selector.matches(".selector-estado")) return;

    const contenedor = contenedores.find(item =>
        item.codigo === selector.dataset.codigo
    );

    const nuevoEstado = selector.value;

    if (!contenedor || !ESTADOS.includes(nuevoEstado)) return;
    if (contenedor.estado === nuevoEstado) return;

    const anterior = contenedor.estado;
    contenedor.estado = nuevoEstado;

    registrarMovimiento(
        `${contenedor.codigo}: cambió de ${anterior} a ${nuevoEstado}.`
    );

    const codigoActualizado = contenedor.codigo;
    const guardado = guardarDatos();

    actualizarPantalla();

    // Recuperar el foco después de reconstruir la tabla.
    const selectorActualizado = Array.from(
        tabla.querySelectorAll(".selector-estado")
    ).find(item => item.dataset.codigo === codigoActualizado);

    if (selectorActualizado) {
        selectorActualizado.focus();
    } else {
        filtroEstado.focus();
    }

    informarGuardado(
        guardado,
        `Estado de ${codigoActualizado} actualizado.`
    );
});

// DESCARGA DEL REPORTE

function prepararCeldaCSV(valor) {
    let texto = String(valor);

    // Evitar fórmulas al abrir el archivo en una hoja de cálculo.
    if (/^[\\s]*[=+@-]/.test(texto) || /^[\\t\\r\\n]/.test(texto)) {
        texto = "'" + texto;
    }

    return '"' + texto.replace(/"/g, '""') + '"';
}

obtener("descargar-reporte").addEventListener("click", () => {
    const filas = [
        ["Código", "Carga", "Ubicación", "Transportista", "Estado"],
        ...contenedores.map(item => [
            item.codigo,
            item.carga,
            item.ubicacion,
            item.transportista,
            item.estado
        ])
    ];

    const textoCSV = "\uFEFF" + filas
        .map(fila => fila.map(prepararCeldaCSV).join(";"))
        .join("\r\n");

    const archivo = new Blob([textoCSV], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "reporte-contenedores.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    notificar("Reporte generado.");
});

// ACCESO DE DEMOSTRACIÓN
// No hay autenticación real ni separación de datos por usuario.
// La contraseña no se almacena ni se envía.

function limpiarLogin() {
    formLogin.reset();

    contrasena.type = "password";
    botonVer.textContent = "Mostrar";
    botonVer.setAttribute("aria-pressed", "false");

    obtener("error-login").textContent = "";
}

botonVer.addEventListener("click", () => {
    const mostrar = contrasena.type === "password";

    contrasena.type = mostrar ? "text" : "password";
    botonVer.textContent = mostrar ? "Ocultar" : "Mostrar";
    botonVer.setAttribute("aria-pressed", String(mostrar));
});

formLogin.addEventListener("submit", evento => {
    evento.preventDefault();

    const nombre = usuario.value.trim();

    if (!nombre || !contrasena.value.trim()) {
        obtener("error-login").textContent =
            "Escribe un usuario y una contraseña para continuar.";
        return;
    }

    obtener("saludo").textContent = `Hola, ${nombre}`;
    obtener("saludo").title = nombre;

    limpiarLogin();

    login.hidden = true;
    aplicacion.hidden = false;

    actualizarPantalla();
    cambiarVista("inicio");

    notificar(`Bienvenido, ${nombre}.`);
});

obtener("cerrar-sesion").addEventListener("click", () => {
    clearTimeout(temporizador);
    obtener("notificacion").hidden = true;

    if (modal.open) {
        modal.close();
    }

    aplicacion.hidden = true;
    login.hidden = false;

    obtener("saludo").textContent = "";
    obtener("saludo").removeAttribute("title");

    busqueda.value = "";
    filtroEstado.value = "";

    limpiarLogin();
    actualizarPantalla();
    cambiarVista("inicio", false);

    usuario.focus();
});

// INICIALIZACIÓN

const hoy = new Date();

obtener("fecha").textContent = hoy.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

obtener("fecha").dateTime = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0")
].join("-");

cargarDatos();
actualizarPantalla();
cambiarVista("inicio", false);

aplicacion.hidden = true;
login.hidden = false;

limpiarLogin();
usuario.focus();