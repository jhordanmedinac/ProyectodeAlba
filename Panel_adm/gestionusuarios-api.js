// ══════════════════════════════════════════════════════════════════
// GESTIÓN DE USUARIOS - CGPVP Admin Panel
// ══════════════════════════════════════════════════════════════════

const API_BASE        = "https://paramedicosdelperu.org/api/admin/usuarios";
const API_MIEMBROS    = `${API_BASE}/miembros`;
const API_POSTULANTES = `${API_BASE}/postulantes`;

// ── DOM ───────────────────────────────────────────────────────────
const usersTableBody     = document.getElementById("usersTableBody");
const searchInput        = document.getElementById("searchInput");
const filterEstado       = document.getElementById("filterEstado");
const filterRango        = document.getElementById("filterRango");
const filterDepartamento = document.getElementById("filterDepartamento");
const filterOrden        = document.getElementById("filterOrden");

// ── Paginación ────────────────────────────────────────────────────
let paginaActual      = 1;
let totalRegistros    = 0;
const registrosPorPagina = 10;

// ── Estado foto ──────────────────────────────────────────────────
let _idMiembroEdicion = null;
const PLACEHOLDER_FOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect width='90' height='90' fill='%23e0e0e0' rx='45'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dy='.1em' font-size='38' fill='%23aaa'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

// ══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    cargarUsuarios();

    searchInput?.addEventListener("input",  () => { paginaActual = 1; cargarUsuarios(); });
    filterEstado?.addEventListener("change", () => { paginaActual = 1; cargarUsuarios(); });
    filterRango?.addEventListener("change",  () => { paginaActual = 1; cargarUsuarios(); });
    filterDepartamento?.addEventListener("change", () => { paginaActual = 1; cargarUsuarios(); });
    filterOrden?.addEventListener("change", () => { paginaActual = 1; cargarUsuarios(); });
});

// ══════════════════════════════════════════════════════════════════
// CARGAR USUARIOS
// ══════════════════════════════════════════════════════════════════
async function cargarUsuarios() {
    try {
        mostrarCargando();

        const busqueda     = searchInput?.value || "";
        const estado       = filterEstado?.value || "";
        const rango        = filterRango?.value || "";
        const departamento = filterDepartamento?.value || "";

        const params = new URLSearchParams({ pagina: paginaActual, por_pagina: registrosPorPagina });
        if (busqueda)     params.append("busqueda", busqueda);
        if (estado)       params.append("estado", estado);
        if (rango)        params.append("rango", rango);
        if (departamento) params.append("departamento", departamento);

        const url = `${API_MIEMBROS}?${params.toString()}`;
        console.log("🔍 Consultando:", url);

        const response = await fetch(url);
        const result   = await response.json();
        console.log("📦 Respuesta API miembros:", result);

        if (result.status === "SUCCESS") {
            totalRegistros = result.total || 0;
            let usuarios   = result.data  || [];

            const orden = filterOrden?.value || "recientes";
            usuarios = [...usuarios].sort((a, b) => {
                const fa = a.fecha_ingreso ? new Date(a.fecha_ingreso) : new Date(0);
                const fb = b.fecha_ingreso ? new Date(b.fecha_ingreso) : new Date(0);
                return orden === "recientes" ? fb - fa : fa - fb;
            });

            renderUsuarios(usuarios);
            actualizarPaginacion();
        } else {
            mostrarError("Error al cargar usuarios");
            renderUsuarios([]);
        }
    } catch (error) {
        console.error("Error cargando usuarios:", error);
        mostrarError("Error de conexión con el servidor");
        renderUsuarios([]);
    } finally {
        ocultarCargando();
    }
}

// ══════════════════════════════════════════════════════════════════
// RENDERIZAR TABLA
// ══════════════════════════════════════════════════════════════════
function renderUsuarios(lista) {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = "";

    if (!lista || lista.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:30px;">
                    <i class="fas fa-users" style="font-size:48px;color:#ccc;margin-bottom:10px;"></i>
                    <p style="color:#999;">No se encontraron miembros</p>
                </td>
            </tr>`;
        return;
    }

    lista.forEach(x => {
        let nombreCompleto = x.nombre_completo || '';
        let nombre = '', apellido = '';

        if (nombreCompleto.includes(',')) {
            const partes = nombreCompleto.split(',');
            apellido = partes[0].trim();
            nombre   = partes[1] ? partes[1].trim() : '';
            nombreCompleto = `${nombre} ${apellido}`.trim();
        } else {
            const partes = nombreCompleto.split(' ');
            nombre   = partes[0] || '';
            apellido = partes.slice(1).join(' ') || '';
        }

        const iniciales   = (nombre.charAt(0) || '') + (apellido.charAt(0) || '');
        if (!nombreCompleto) nombreCompleto = 'Sin nombre';

        const rolTexto  = x.rango  || '-';
        const rolClass  = 'role-' + rolTexto.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
            .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
            .replace(/[úùü]/g,'u').replace(/ñ/g,'n');

        const estadoTexto = x.estado || '-';
        const estadoClass = 'status-' + estadoTexto.toLowerCase();

        let nivelTexto = '-';
        if (x.nivel) {
            nivelTexto = x.nivel.toUpperCase();
        } else if (x.departamento) {
            nivelTexto = x.departamento.charAt(0).toUpperCase() + x.departamento.slice(1).toLowerCase();
        }

        // Avatar: imagen si tiene_foto, iniciales si no
        const avatarInner = x.tiene_foto
            ? `<img src="${PLACEHOLDER_FOTO}" data-miembro-id="${x.id}" alt="${nombreCompleto}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : iniciales;

        usersTableBody.innerHTML += `
            <tr data-user-id="${x.id}">
                <td data-label="Seleccionar"><input type="checkbox"></td>
                <td data-label="Usuario">
                    <div class="user-cell">
                        <div class="user-avatar" style="${x.tiene_foto ? 'padding:0;overflow:hidden;' : ''}">
                            ${avatarInner}
                        </div>
                        <div>
                            <div class="user-name">${nombreCompleto}</div>
                            <div class="user-email">${x.email || 'Sin email'}</div>
                        </div>
                    </div>
                </td>
                <td data-label="DNI">${x.dni || '-'}</td>
                <td data-label="Rol"><span class="role-badge ${rolClass}">${rolTexto}</span></td>
                <td data-label="Nivel">${nivelTexto}</td>
                <td data-label="Estado"><span class="status-badge ${estadoClass}">${estadoTexto.toUpperCase()}</span></td>
                <td data-label="Fecha Ingreso">${formatearFecha(x.fecha_ingreso)}</td>
                <td data-label="Acciones" class="text-center">
                    <div class="action-buttons">
                        <button class="btn-icon btn-view"   onclick="viewUsuario(${x.id})"                    title="Ver detalles"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon btn-edit"   onclick="editUsuario(${x.id})"                    title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" onclick="confirmarEliminarMiembroFisico(${x.id})" title="Eliminar" style="background:#e74c3c;color:white;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`;
    });

    // Cargar fotos reales en diferido
    lista.filter(x => x.tiene_foto).forEach(x => {
        fetch(`${API_MIEMBROS}/${x.id}/foto`)
            .then(r => r.json())
            .then(result => {
                if (!result.tiene_foto) return;
                const img = document.querySelector(`img[data-miembro-id="${x.id}"]`);
                if (img) img.src = `data:image/jpeg;base64,${result.foto_base64}`;
            })
            .catch(() => {});
    });

    console.log(`✅ ${lista.length} usuarios renderizados`);
}

// ══════════════════════════════════════════════════════════════════
// VER DETALLE
// ══════════════════════════════════════════════════════════════════
async function viewUsuario(id) {
    try {
        mostrarCargando();
        const response = await fetch(`${API_MIEMBROS}/${id}`);
        const result   = await response.json();

        if (result.status === "SUCCESS") {
            mostrarModalDetalle(result.miembro, result.cursos || [], result.eventos || []);
        } else {
            mostrarError("No se pudo cargar el detalle del usuario");
        }
    } catch (error) {
        console.error("❌ Error al cargar detalle:", error);
        mostrarError("Error al cargar el detalle");
    } finally {
        ocultarCargando();
    }
}

// ══════════════════════════════════════════════════════════════════
// EDITAR USUARIO
// ══════════════════════════════════════════════════════════════════
async function editUsuario(id) {
    try {
        const response = await fetch(`${API_MIEMBROS}/${id}`);
        const result   = await response.json();
        if (result.status === "SUCCESS") mostrarModalEditar(result.miembro);
    } catch (error) {
        console.error("Error:", error);
        mostrarError("Error al cargar datos del usuario");
    }
}

// ══════════════════════════════════════════════════════════════════
// CAMBIAR ESTADO / RANGO
// ══════════════════════════════════════════════════════════════════
async function cambiarEstado(idMiembro, nuevoEstado, motivo) {
    try {
        mostrarCargando();
        const response = await fetch(`${API_MIEMBROS}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_miembro: idMiembro, nuevo_estado: nuevoEstado, motivo, admin_id: 1 })
        });
        const result = await response.json();
        if (result.status === "SUCCESS") { mostrarExito("Estado actualizado correctamente"); cargarUsuarios(); cerrarModalActivo(); }
        else mostrarError("No se pudo actualizar el estado");
    } catch (error) { console.error("Error:", error); mostrarError("Error al cambiar el estado"); }
    finally { ocultarCargando(); }
}

async function cambiarRango(idMiembro, nuevoRango, motivo) {
    try {
        mostrarCargando();
        const response = await fetch(`${API_MIEMBROS}/rango`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_miembro: idMiembro, nuevo_rango: nuevoRango, motivo, admin_id: 1 })
        });
        const result = await response.json();
        if (result.status === "SUCCESS") { mostrarExito("Rango actualizado correctamente"); cargarUsuarios(); cerrarModalActivo(); }
        else mostrarError("No se pudo actualizar el rango");
    } catch (error) { console.error("Error:", error); mostrarError("Error al cambiar el rango"); }
    finally { ocultarCargando(); }
}

// ══════════════════════════════════════════════════════════════════
// HISTORIAL
// ══════════════════════════════════════════════════════════════════
async function verHistorial(id) {
    try {
        mostrarCargando();
        const response = await fetch(`${API_MIEMBROS}/${id}/historial`);
        const result   = await response.json();
        if (result.status === "SUCCESS") mostrarModalHistorial(result.data);
        else mostrarError("No se pudo cargar el historial");
    } catch (error) { console.error("Error:", error); mostrarError("Error al cargar el historial"); }
    finally { ocultarCargando(); }
}

// ══════════════════════════════════════════════════════════════════
// EXPORTAR CSV
// ══════════════════════════════════════════════════════════════════
async function exportarCSV() {
    try {
        mostrarCargando();
        const params = new URLSearchParams();
        if (filterEstado?.value)       params.append("estado", filterEstado.value);
        if (filterRango?.value)        params.append("rango", filterRango.value);
        if (filterDepartamento?.value) params.append("departamento", filterDepartamento.value);

        const response = await fetch(`${API_MIEMBROS}/exportar/csv?${params.toString()}`);
        const result   = await response.json();

        if (result.status === "SUCCESS" && result.data.length > 0) {
            descargarCSV(result.data, 'miembros_cgpvp.csv');
            mostrarExito(`${result.total} registros exportados correctamente`);
        } else {
            mostrarError("No hay datos para exportar");
        }
    } catch (error) { console.error("❌ Error:", error); mostrarError("Error al exportar los datos"); }
    finally { ocultarCargando(); }
}

// ══════════════════════════════════════════════════════════════════
// PAGINACIÓN
// ══════════════════════════════════════════════════════════════════
function actualizarPaginacion() {
    const totalPaginas  = Math.ceil(totalRegistros / registrosPorPagina);
    const paginacionDiv = document.getElementById("paginacion");
    if (!paginacionDiv) return;

    let html = `
        <div class="pagination-info">
            Mostrando ${((paginaActual - 1) * registrosPorPagina) + 1} -
            ${Math.min(paginaActual * registrosPorPagina, totalRegistros)}
            de ${totalRegistros} registros
        </div>
        <div class="pagination-controls">
            <button onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''} class="btn-page">
                <i class="fas fa-chevron-left"></i>
            </button>`;

    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
            html += `<button onclick="cambiarPagina(${i})" class="btn-page ${i === paginaActual ? 'active' : ''}">${i}</button>`;
        } else if (i === paginaActual - 3 || i === paginaActual + 3) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }

    html += `
            <button onclick="cambiarPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''} class="btn-page">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>`;

    paginacionDiv.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    paginaActual = nuevaPagina;
    cargarUsuarios();
}

// ══════════════════════════════════════════════════════════════════
// MODAL: DETALLE DE MIEMBRO
// ══════════════════════════════════════════════════════════════════
function mostrarModalDetalle(miembro, cursos, eventos) {
    document.getElementById("modalDetalleUsuario")?.remove();

    const nombre    = miembro.nombre_completo || `${miembro.nombre || ''} ${miembro.apellido || ''}`.trim() || '-';
    const iniciales = ((miembro.nombre?.[0] || '') + (miembro.apellido?.[0] || '')).toUpperCase() || '?';
    const rango     = miembro.rango  || '-';
    const estado    = miembro.estado || '-';
    const rolClass  = 'role-'   + rango.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const estClass  = 'status-' + estado.toLowerCase();

    // Avatar con foto real o iniciales
    const avatarHTML = miembro.foto_base64
        ? `<img src="data:image/jpeg;base64,${miembro.foto_base64}" alt="${nombre}"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : iniciales;

    // Certificaciones propias (texto plano separado por comas)
    const certsRaw  = miembro.cursos_certificaciones || "";
    const certsHTML = certsRaw
        ? `<div style="margin-bottom:24px;">
               <h4 style="color:var(--navy,#00093C);border-bottom:2px solid #f0f0f0;padding-bottom:8px;margin-bottom:12px;">
                   <i class="fas fa-certificate" style="margin-right:8px;color:var(--gold,#FDB750);"></i>Certificaciones
               </h4>
               <div style="display:flex;flex-wrap:wrap;gap:8px;">
                   ${certsRaw.split(",").map(c => `
                       <span style="background:#f0f4ff;border:1px solid #c5d0e6;border-radius:20px;
                                    padding:4px 12px;font-size:13px;">${c.trim()}</span>`).join("")}
               </div>
           </div>`
        : "";

    const filaCursos = cursos.length > 0
        ? cursos.map(c => `
            <tr>
                <td>${c.titulo || '-'}</td>
                <td>${c.categoria || '-'}</td>
                <td>${c.modalidad || '-'}</td>
                <td><span class="status-badge status-${(c.estado_inscripcion||'').toLowerCase()}">${c.estado_inscripcion || '-'}</span></td>
                <td>${formatearFecha(c.fecha_inscripcion)}</td>
            </tr>`).join('')
        : `<tr><td colspan="5" style="text-align:center;color:#999;">Sin cursos registrados</td></tr>`;

    const filaEventos = eventos.length > 0
        ? eventos.map(e => `
            <tr>
                <td>${e.titulo || '-'}</td>
                <td>${e.tipo   || '-'}</td>
                <td>${formatearFecha(e.fecha)}</td>
                <td><span class="status-badge status-${(e.estado_inscripcion||'').toLowerCase()}">${e.estado_inscripcion || '-'}</span></td>
            </tr>`).join('')
        : `<tr><td colspan="4" style="text-align:center;color:#999;">Sin eventos registrados</td></tr>`;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay active" id="modalDetalleUsuario" onclick="if(event.target===this)cerrarModalDetalle()">
            <div class="modal-container" style="max-width:760px;">
                <div class="modal-header">
                    <h3>Ficha del Miembro</h3>
                    <button class="modal-close" onclick="cerrarModalDetalle()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="overflow-y:auto;max-height:75vh;">

                    <!-- Cabecera -->
                    <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;background:#f8f9fa;border-radius:12px;padding:18px;">
                        <div class="user-avatar" style="width:72px;height:72px;font-size:26px;flex-shrink:0;padding:0;overflow:hidden;">
                            ${avatarHTML}
                        </div>
                        <div style="flex:1;">
                            <h3 style="margin:0 0 6px;color:var(--navy,#00093C);">${nombre}</h3>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                                <span class="role-badge ${rolClass}">${rango}</span>
                                <span class="status-badge ${estClass}">${estado.toUpperCase()}</span>
                                ${miembro.legajo ? `<span style="font-size:12px;color:#666;"><i class="fas fa-id-card" style="margin-right:4px;"></i>${miembro.legajo}</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align:right;font-size:13px;color:#666;">
                            <div><i class="fas fa-calendar-plus" style="margin-right:4px;"></i>Ingreso: <strong>${formatearFecha(miembro.fecha_ingreso)}</strong></div>
                            ${miembro.anios_en_cuerpo !== undefined ? `<div style="margin-top:4px;"><i class="fas fa-clock" style="margin-right:4px;"></i>${miembro.anios_en_cuerpo} año(s) en el cuerpo</div>` : ''}
                        </div>
                    </div>

                    <!-- Datos personales -->
                    <h4 style="color:var(--navy,#00093C);border-bottom:2px solid #f0f0f0;padding-bottom:8px;margin-bottom:16px;">
                        <i class="fas fa-user" style="margin-right:8px;color:var(--gold,#FDB750);"></i>Datos Personales
                    </h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;margin-bottom:24px;">
                        <div><span style="color:#888;font-size:12px;">DNI</span><div><strong>${miembro.dni || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Fecha Nacimiento</span><div><strong>${formatearFecha(miembro.fecha_nacimiento) || '-'}</strong>${miembro.edad ? ` <span style="color:#888;font-size:12px;">(${miembro.edad} años)</span>` : ''}</div></div>
                        <div><span style="color:#888;font-size:12px;">Género</span><div><strong>${miembro.genero || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Teléfono</span><div><strong>${miembro.telefono || '-'}</strong></div></div>
                        <div style="grid-column:1/-1;"><span style="color:#888;font-size:12px;">Email</span><div><strong>${miembro.email || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Departamento</span><div><strong>${miembro.departamento || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Distrito</span><div><strong>${miembro.distrito || '-'}</strong></div></div>
                        <div style="grid-column:1/-1;"><span style="color:#888;font-size:12px;">Dirección</span><div><strong>${miembro.direccion || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Profesión</span><div><strong>${miembro.profesion || '-'}</strong></div></div>
                        <div><span style="color:#888;font-size:12px;">Jefatura</span><div><strong>${miembro.jefatura || '-'}</strong></div></div>
                    </div>

                    ${certsHTML}

                    <!-- Cursos inscritos -->
                    <h4 style="color:var(--navy,#00093C);border-bottom:2px solid #f0f0f0;padding-bottom:8px;margin-bottom:12px;">
                        <i class="fas fa-graduation-cap" style="margin-right:8px;color:var(--gold,#FDB750);"></i>Cursos
                        <span style="font-size:13px;font-weight:400;color:#888;margin-left:8px;">(${cursos.length})</span>
                    </h4>
                    <div style="overflow-x:auto;margin-bottom:24px;">
                        <table class="data-table" style="font-size:13px;">
                            <thead><tr><th>Título</th><th>Categoría</th><th>Modalidad</th><th>Estado</th><th>Inscripción</th></tr></thead>
                            <tbody>${filaCursos}</tbody>
                        </table>
                    </div>

                    <!-- Eventos inscritos -->
                    <h4 style="color:var(--navy,#00093C);border-bottom:2px solid #f0f0f0;padding-bottom:8px;margin-bottom:12px;">
                        <i class="fas fa-calendar-alt" style="margin-right:8px;color:var(--gold,#FDB750);"></i>Eventos
                        <span style="font-size:13px;font-weight:400;color:#888;margin-left:8px;">(${eventos.length})</span>
                    </h4>
                    <div style="overflow-x:auto;">
                        <table class="data-table" style="font-size:13px;">
                            <thead><tr><th>Título</th><th>Tipo</th><th>Fecha</th><th>Estado</th></tr></thead>
                            <tbody>${filaEventos}</tbody>
                        </table>
                    </div>

                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalDetalle()">Cerrar</button>
                    <button class="btn-primary" onclick="cerrarModalDetalle(); editUsuario(${miembro.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        </div>`);

    document.body.style.overflow = 'hidden';
}

function cerrarModalDetalle() {
    const modal = document.getElementById("modalDetalleUsuario");
    if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

function mostrarModalEditar(miembro) {
    _idMiembroEdicion = miembro.id;

    // Campos base
    document.getElementById("editIdMiembro").value  = miembro.id       || "";
    document.getElementById("editNombre").value     = miembro.nombre   || "";
    document.getElementById("editApellido").value   = miembro.apellido || "";
    document.getElementById("editDni").value        = miembro.dni      || "";
    document.getElementById("editEmail").value      = miembro.email    || "";
    document.getElementById("editTelefono").value   = miembro.telefono || "";
    document.getElementById("editFechaNac").value      = miembro.fecha_nacimiento
        ? miembro.fecha_nacimiento.split("T")[0] : "";
    document.getElementById("editFechaIngreso").value  = miembro.fecha_ingreso
        ? miembro.fecha_ingreso.split("T")[0] : "";
    document.getElementById("editJefatura").value  = miembro.jefatura  || "";
    document.getElementById("editDireccion").value = miembro.direccion || "";
    document.getElementById("editDistrito").value  = miembro.distrito  || "";

    const setSelect = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = val || "";
        if (el.value !== (val || "")) el.value = "";
    };
    setSelect("editGenero",       miembro.genero);
    setSelect("editRol",          miembro.rango);
    setSelect("editEstado",       miembro.estado);
    setSelect("editProfesion",    miembro.profesion);
    setSelect("editDepartamento", miembro.departamento);

    const alerta = document.getElementById("editUserAlert");
    if (alerta) alerta.style.display = "none";

    _inyectarSeccionFoto(miembro);
    _inyectarSeccionCursos(miembro.id, miembro.cursos_certificaciones);

    openModal("editUserModal");

    // Guardar valores originales y proteger click-afuera
    setTimeout(() => {
        _guardarValoresOriginales();
        const overlay = document.getElementById("editUserModal");
        if (overlay) overlay.onclick = e => { if (e.target === overlay) intentarCerrarModalEditar(); };
    }, 50);
}

// ── Sección Foto ──────────────────────────────────────────────────
function _inyectarSeccionFoto(miembro) {
    document.getElementById("seccionFotoEditar")?.remove();

    const form = document.getElementById("editUserForm");
    if (!form) return;

    const sec = document.createElement("div");
    sec.id = "seccionFotoEditar";
    sec.innerHTML = `
        <hr style="margin:20px 0;border-color:#eee;">
        <h4 style="color:#00093C;margin-bottom:12px;">
            <i class="fas fa-camera" style="color:#FDB750;margin-right:8px;"></i>Foto de Perfil
        </h4>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <div style="width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid #0066cc;flex-shrink:0;">
                <img id="fotoPreviewEditar"
                     src="${miembro.foto_base64 ? 'data:image/jpeg;base64,' + miembro.foto_base64 : PLACEHOLDER_FOTO}"
                     alt="Foto" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <label class="btn-secondary" style="cursor:pointer;font-size:13px;margin:0;">
                    <i class="fas fa-upload"></i> Subir foto
                    <input type="file" id="inputFotoEditar" accept="image/jpeg,image/png,image/webp"
                           style="display:none;" onchange="handleFotoSeleccionada(this)">
                </label>
                <button type="button" class="btn-secondary"
                        style="font-size:13px;color:#e74c3c;border-color:#e74c3c;"
                        onclick="eliminarFotoMiembro(${miembro.id})">
                    <i class="fas fa-trash-alt"></i> Quitar foto
                </button>
                <small style="color:#999;">JPG, PNG o WEBP · máx. 2 MB</small>
            </div>
        </div>`;

    const footer = form.querySelector(".modal-footer");
    footer ? form.insertBefore(sec, footer) : form.appendChild(sec);
}

// ── Sección Cursos ────────────────────────────────────────────────
function _inyectarSeccionCursos(idMiembro, valorActual) {
    document.getElementById("seccionCursosEditar")?.remove();
    const form = document.getElementById("editUserForm");
    if (!form) return;

    const sec = document.createElement("div");
    sec.id = "seccionCursosEditar";
    sec.innerHTML = `
        <hr style="margin:20px 0;border-color:#eee;">
        <h4 style="color:#00093C;margin-bottom:8px;">
            <i class="fas fa-graduation-cap" style="color:#FDB750;margin-right:8px;"></i>
            Cursos y Certificaciones
        </h4>
        <small style="color:#888;display:block;margin-bottom:10px;">
            Escribe las certificaciones separadas por coma. Ej: BLS, ACLS, Primeros Auxilios
        </small>
        <div class="form-group" style="margin:0;">
            <input type="text" id="inputCursosCerts"
                   value="${valorActual || ''}"
                   placeholder="Ej: BLS, ACLS, Enfermería de Emergencias"
                   style="width:100%;">
        </div>
        <div style="margin-top:10px;text-align:right;">
            <button type="button" class="btn-primary" onclick="guardarCursosMiembro(${idMiembro})">
                <i class="fas fa-save"></i> Guardar certificaciones
            </button>
        </div>`;

    const footer = form.querySelector(".modal-footer");
    footer ? form.insertBefore(sec, footer) : form.appendChild(sec);
}
// ══════════════════════════════════════════════════════════════════
// FOTO — funciones
// ══════════════════════════════════════════════════════════════════
async function handleFotoSeleccionada(input) {
    if (!input.files?.[0] || !_idMiembroEdicion) return;
    const archivo = input.files[0];

    if (!["image/jpeg","image/png","image/webp"].includes(archivo.type)) {
        showToast(" Solo JPG, PNG o WEBP", "error"); return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
        showToast(" Máximo 2 MB", "error"); return;
    }

    const formData = new FormData();
    formData.append("foto", archivo);

    try {
        const res    = await fetch(`${API_MIEMBROS}/${_idMiembroEdicion}/foto?admin_id=1`, { method: "PUT", body: formData });
        const result = await res.json();

        if (res.ok && result.status === "SUCCESS") {
            const reader = new FileReader();
            reader.onload = e => {
                const img = document.getElementById("fotoPreviewEditar");
                if (img) img.src = e.target.result;
            };
            reader.readAsDataURL(archivo);
            showToast(" Foto actualizada", "success");
        } else {
            showToast(" " + (result.detail || "Error al subir la foto"), "error");
        }
    } catch { showToast(" Error de conexión al subir foto", "error"); }
    finally  { input.value = ""; }
}

async function eliminarFotoMiembro(idMiembro) {
    if (!confirm("¿Eliminar la foto de perfil de este miembro?")) return;
    try {
        const res    = await fetch(`${API_MIEMBROS}/${idMiembro}/foto?admin_id=1`, { method: "DELETE" });
        const result = await res.json();
        if (res.ok && result.status === "SUCCESS") {
            const img = document.getElementById("fotoPreviewEditar");
            if (img) img.src = PLACEHOLDER_FOTO;
            showToast("🗑️ Foto eliminada", "success");
        } else {
            showToast("❌ " + (result.detail || "Error al eliminar foto"), "error");
        }
    } catch { showToast("❌ Error de conexión", "error"); }
}

// ══════════════════════════════════════════════════════════════════
// CURSOS — texto plano separado por comas
// ══════════════════════════════════════════════════════════════════
async function guardarCursosMiembro(idMiembro) {
    const input = document.getElementById("inputCursosCerts");
    if (!input) return;
    const valor = input.value.trim();
    try {
        const res = await fetch(`${API_MIEMBROS}/${idMiembro}/cursos`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cursos_certificaciones: valor, admin_id: 1 })
        });
        const result = await res.json();
        if (res.ok && result.status === "SUCCESS") showToast("✅ Certificaciones guardadas", "success");
        else showToast("❌ " + (result.detail || "Error al guardar"), "error");
    } catch { showToast("❌ Error de conexión", "error"); }
}

// ══════════════════════════════════════════════════════════════════
// GUARDAR EDICIÓN
// ══════════════════════════════════════════════════════════════════
async function guardarEdicionMiembro() {
    const btn    = document.getElementById("btnGuardarEdicion");
    const alerta = document.getElementById("editUserAlert");

    const mostrarErrorEdicion = (msg) => {
        if (!alerta) return;
        alerta.style.display    = "block";
        alerta.style.background = "#fde8e8";
        alerta.style.color      = "#c0392b";
        alerta.style.border     = "1px solid #e74c3c";
        alerta.textContent      = msg;
    };

    const id        = document.getElementById("editIdMiembro")?.value;
    const nombre    = document.getElementById("editNombre")?.value.trim();
    const apellido  = document.getElementById("editApellido")?.value.trim();
    const dni       = document.getElementById("editDni")?.value.trim();
    const email     = document.getElementById("editEmail")?.value.trim();
    const telefono  = document.getElementById("editTelefono")?.value.trim();
    const fechaNac      = document.getElementById("editFechaNac")?.value;
    const fechaIngreso  = document.getElementById("editFechaIngreso")?.value;
    const genero    = document.getElementById("editGenero")?.value;
    const rango     = document.getElementById("editRol")?.value;
    const jefatura  = document.getElementById("editJefatura")?.value.trim();
    const estado    = document.getElementById("editEstado")?.value;
    const profesion = document.getElementById("editProfesion")?.value;
    const depto     = document.getElementById("editDepartamento")?.value;
    const distrito  = document.getElementById("editDistrito")?.value.trim();
    const direccion = document.getElementById("editDireccion")?.value.trim();

    if (!nombre || !apellido)                      { mostrarErrorEdicion("Nombre y apellido son obligatorios."); return; }
    if (!/^\d{8}$/.test(dni))                      { mostrarErrorEdicion("El DNI debe tener 8 dígitos."); return; }
    if (!genero)                                   { mostrarErrorEdicion("El género es obligatorio."); return; }
    if (!jefatura)                                 { mostrarErrorEdicion("La jefatura es obligatoria."); return; }
    if (telefono && !/^[0-9]{9}$/.test(telefono)) { mostrarErrorEdicion("El teléfono debe tener 9 dígitos."); return; }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }

    try {
        const response = await fetch(`${API_MIEMBROS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_miembro: parseInt(id),
                nombre, apellido, dni,
                email:            email     || null,
                telefono:         telefono  || null,
                fecha_nacimiento: fechaNac  || null,
                genero,
                departamento:     depto     || null,
                distrito:         distrito  || null,
                direccion:        direccion || null,
                profesion:        profesion || null,
                rango, jefatura, estado,
                fecha_ingreso:    fechaIngreso || null,
                admin_id: 1,
            }),
        });

        const result = await response.json();

        if (response.ok && result.status === "SUCCESS") {
            closeModal("editUserModal");
            showToast("✅ Miembro actualizado correctamente", "success");
            cargarUsuarios();
        } else {
            mostrarErrorEdicion(result.detail || result.mensaje || "No se pudo actualizar el miembro.");
        }
    } catch (error) {
        console.error("❌ Error al editar:", error);
        mostrarErrorEdicion("Error de conexión con el servidor.");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios'; }
    }
}

// ══════════════════════════════════════════════════════════════════
// HISTORIAL / MODALES AUXILIARES
// ══════════════════════════════════════════════════════════════════
function mostrarModalHistorial(historial) {
    alert(`Historial del miembro:\n\n${JSON.stringify(historial, null, 2)}`);
}

function cerrarModalActivo() {
    document.querySelector('.modal-overlay.active')?.remove();
}

// ══════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════
function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function mostrarCargando()  { const l = document.getElementById("loader"); if (l) l.style.display = "block"; }
function ocultarCargando()  { const l = document.getElementById("loader"); if (l) l.style.display = "none";  }
function mostrarExito(msg)  { console.log("✅", msg);  alert(msg); }
function mostrarError(msg)  { console.error("❌", msg); alert(msg); }

function descargarCSV(data, nombreArchivo) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const v = row[h] || '';
            return v.toString().includes(',') ? `"${v.toString().replace(/"/g,'""')}"` : v;
        }).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
    URL.revokeObjectURL(link.href);
}

function toggleSidebar() { document.getElementById("sidebar")?.classList.toggle("collapsed"); }

function logout() {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
        localStorage.removeItem('admin_token');
        window.location.href = 'login.html';
    }
}

// ══════════════════════════════════════════════════════════════════
// AGREGAR USUARIO
// ══════════════════════════════════════════════════════════════════
const CAMPOS_FORM_USUARIO = [
    "addNombre","addApellido","addDni","addEmail",
    "addTelefono","addFechaNac","addGenero","addRol",
    "addJefatura","addEstado","addProfesion","addDepartamento"
];

function formularioTieneDatos() {
    return CAMPOS_FORM_USUARIO.some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const val = el.value.trim();
        if (el.tagName === "SELECT") return val !== "" && val !== "Aspirante" && val !== "Activo";
        return val !== "";
    });
}

// ── Protección click-afuera para modal EDITAR ─────────────────────
const CAMPOS_FORM_EDITAR = [
    "editNombre", "editApellido", "editDni", "editEmail",
    "editTelefono", "editFechaNac", "editFechaIngreso", "editJefatura"
];

let _valoresOriginalesEditar = {};

function _guardarValoresOriginales() {
    CAMPOS_FORM_EDITAR.forEach(id => {
        const el = document.getElementById(id);
        _valoresOriginalesEditar[id] = el ? el.value.trim() : "";
    });
    ["editGenero", "editRol", "editEstado", "editProfesion", "editDepartamento"].forEach(id => {
        const el = document.getElementById(id);
        _valoresOriginalesEditar[id] = el ? el.value : "";
    });
}

function editFormularioTieneCambios() {
    const todosLosCampos = [...CAMPOS_FORM_EDITAR, "editGenero", "editRol", "editEstado", "editProfesion", "editDepartamento"];
    return todosLosCampos.some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        return el.value.trim() !== (_valoresOriginalesEditar[id] ?? "").trim();
    });
}

function intentarCerrarModalEditar() {
    editFormularioTieneCambios()
        ? openModal("discardEditModal")
        : closeModal("editUserModal");
}

function descartarYCerrarEditar() {
    _valoresOriginalesEditar = {};
    closeModal("discardEditModal");
    closeModal("editUserModal");
}

function abrirModalAgregarUsuario() {
    const form = document.getElementById("addUserForm");
    if (form) form.reset();
    ocultarAlertaModal();

    // Limpiar foto preview
    const preview = document.getElementById("addFotoPreview");
    if (preview) preview.src = PLACEHOLDER_FOTO;
    const inputFoto = document.getElementById("addInputFoto");
    if (inputFoto) inputFoto.value = "";

    // Limpiar certs
    const inputCerts = document.getElementById("addInputCerts");
    if (inputCerts) inputCerts.value = "";

    const overlay = document.getElementById("addUserModal");
    if (overlay) overlay.onclick = e => { if (e.target === overlay) intentarCerrarModal(); };
    openModal("addUserModal");
}

function intentarCerrarModal() {
    formularioTieneDatos() ? openModal("discardUserModal") : closeModal("addUserModal");
}

function descartarYCerrar() {
    document.getElementById("addUserForm")?.reset();
    ocultarAlertaModal();
    closeModal("discardUserModal");
    closeModal("addUserModal");
}

async function guardarNuevoUsuario() {
    const btn = document.getElementById("btnGuardarUsuario");

    const nombre       = document.getElementById("addNombre")?.value.trim();
    const apellido     = document.getElementById("addApellido")?.value.trim();
    const dni          = document.getElementById("addDni")?.value.trim();
    const email        = document.getElementById("addEmail")?.value.trim();
    const telefono     = document.getElementById("addTelefono")?.value.trim();
    const fechaNac          = document.getElementById("addFechaNac")?.value;
    const fechaIngreso      = document.getElementById("addFechaIngreso")?.value;
    const genero       = document.getElementById("addGenero")?.value;
    const jefatura     = document.getElementById("addJefatura")?.value.trim();
    const rango        = document.getElementById("addRol")?.value;
    const estado       = document.getElementById("addEstado")?.value;
    const profesion    = document.getElementById("addProfesion")?.value.trim();
    const departamento = document.getElementById("addDepartamento")?.value;
    const certs        = document.getElementById("addInputCerts")?.value.trim() || null;
    const archivoFoto  = document.getElementById("addInputFoto")?.files?.[0] || null;

    if (!nombre || !apellido)                      { mostrarAlertaModal("El nombre y apellido son obligatorios.", "error"); return; }
    if (!/^\d{8}$/.test(dni))                      { mostrarAlertaModal("El DNI debe tener exactamente 8 dígitos.", "error"); return; }
    if (!email)                                    { mostrarAlertaModal("El email es obligatorio.", "error"); return; }
    if (!genero)                                   { mostrarAlertaModal("El género es obligatorio.", "error"); return; }
    if (telefono && !/^[0-9]{9}$/.test(telefono)) { mostrarAlertaModal("El teléfono debe tener exactamente 9 dígitos.", "error"); return; }
    if (!jefatura)                                 { mostrarAlertaModal("La jefatura es obligatoria.", "error"); return; }

    if (archivoFoto) {
        if (!["image/jpeg","image/png","image/webp"].includes(archivoFoto.type)) {
            mostrarAlertaModal("La foto debe ser JPG, PNG o WEBP.", "error"); return;
        }
        if (archivoFoto.size > 2 * 1024 * 1024) {
            mostrarAlertaModal("La foto supera el máximo de 2 MB.", "error"); return;
        }
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }

    try {
        // 1. Crear el miembro
        const response = await fetch(API_MIEMBROS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre, apellido, dni,
                email:            email        || null,
                telefono:         telefono      || null,
                fecha_nacimiento: fechaNac      || null,
                genero:           genero        || null,
                jefatura:         jefatura      || "",
                departamento:     departamento  || null,
                profesion:        profesion     || null,
                rango:            rango         || "Aspirante",
                estado:           estado        || "Activo",
                fecha_ingreso:    fechaIngreso  || null,
                admin_id: 1,
            }),
        });

        const result = await response.json();

        if (!response.ok || result.status !== "SUCCESS") {
            mostrarAlertaModal(result.detail || result.mensaje || "No se pudo crear el usuario.", "error");
            return;
        }

        const idNuevo = result.id_miembro;

        // 2. Subir foto si eligieron una
        if (archivoFoto && idNuevo) {
            const fd = new FormData();
            fd.append("foto", archivoFoto);
            try {
                await fetch(`${API_MIEMBROS}/${idNuevo}/foto?admin_id=1`, { method: "PUT", body: fd });
            } catch (e) { console.warn("⚠️ No se pudo subir la foto:", e); }
        }

        // 3. Guardar certs si escribieron algo
        if (certs && idNuevo) {
            try {
                const resCerts = await fetch(`${API_MIEMBROS}/${idNuevo}/cursos`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cursos_certificaciones: certs, admin_id: 1 })
                });
                const certsJson = await resCerts.json();
                if (!resCerts.ok || certsJson.status !== "SUCCESS") {
                    console.warn("⚠️ Certs no guardadas:", certsJson);
                }
            } catch (e) { console.warn("⚠️ Error al guardar certificaciones:", e); }
        }

        closeModal("addUserModal");
        showToast(`✅ Miembro creado. Legajo: ${result.legajo}`, "success");
        cargarUsuarios();

    } catch (error) {
        console.error("❌ Error al guardar usuario:", error);
        mostrarAlertaModal("Error de conexión con el servidor.", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
    }
}

function mostrarAlertaModal(mensaje, tipo = "error") {
    const alertDiv = document.getElementById("addUserAlert");
    if (!alertDiv) return;
    const esError = tipo === "error";
    alertDiv.style.display    = "block";
    alertDiv.style.background = esError ? "#fde8e8" : "#e8f5e9";
    alertDiv.style.color      = esError ? "#c0392b" : "#27ae60";
    alertDiv.style.border     = `1px solid ${esError ? "#e74c3c" : "#2ecc71"}`;
    alertDiv.textContent      = mensaje;
}

function ocultarAlertaModal() {
    const alertDiv = document.getElementById("addUserAlert");
    if (alertDiv) alertDiv.style.display = "none";
}

// ══════════════════════════════════════════════════════════════════
// ELIMINAR MIEMBRO FÍSICAMENTE
// ══════════════════════════════════════════════════════════════════
async function confirmarEliminarMiembroFisico(id) {
    try {
        const response = await fetch(`${API_MIEMBROS}/${id}`);
        const result   = await response.json();

        if (result.status !== "SUCCESS" || !result.miembro) {
            mostrarError("No se pudo obtener la información del miembro"); return;
        }

        const miembro        = result.miembro;
        const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`;

        const modal = document.getElementById("deleteUserModal");
        if (modal) modal.dataset.userId = id;

        const modalBody = document.querySelector("#deleteUserModal .modal-message");
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align:center;">
                    <div class="del-avatar">
                        <i class="fas fa-user-times"></i>
                    </div>
                    <h3 class="del-title">⚠️ ADVERTENCIA: Eliminación Permanente</h3>
                    <p class="del-subtitle">
                        Estás a punto de <strong>eliminar permanentemente</strong> al miembro:
                    </p>
                    <div class="del-info-card">
                        <p><strong>Nombre:</strong> <span>${nombreCompleto}</span></p>
                        <p><strong>DNI:</strong> <span>${miembro.dni}</span></p>
                        <p><strong>Legajo:</strong> <span>${miembro.legajo}</span></p>
                        <p><strong>Rango:</strong> <span>${miembro.rango}</span></p>
                    </div>
                    <div class="del-warning-box">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Esta acción NO SE PUEDE DESHACER. Se eliminarán todos los registros de la base de datos.</p>
                    </div>
                    <p class="del-note">
                        Si solo deseas desactivar al miembro, usa "Cambiar Estado" a <strong>Baja</strong>.
                    </p>
                </div>`;
        }

        openModal("deleteUserModal");
    } catch (error) {
        console.error("Error al obtener datos del miembro:", error);
        mostrarError("Error al cargar la información del miembro");
    }
}

async function eliminarMiembroFisico() {
    const modal  = document.getElementById("deleteUserModal");
    const userId = modal?.dataset.userId;
    if (!userId) { mostrarError("No se pudo identificar el miembro a eliminar"); return; }

    const btnEliminar = document.getElementById("btnConfirmDelete");

    try {
        if (btnEliminar) { btnEliminar.disabled = true; btnEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'; }

        const response = await fetch(`${API_MIEMBROS}/${userId}/eliminar-fisico`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmacion: true })
        });
        const result = await response.json();

        if (response.ok && result.status === "SUCCESS") {
            closeModal("deleteUserModal");
            showToast("🗑️ Miembro eliminado permanentemente de la base de datos", "success");
            cargarUsuarios();
        } else {
            mostrarError(result.detail || "No se pudo eliminar el miembro");
        }
    } catch (error) {
        console.error("Error al eliminar miembro:", error);
        mostrarError("Error de conexión con el servidor");
    } finally {
        if (btnEliminar) { btnEliminar.disabled = false; btnEliminar.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar Permanentemente'; }
    }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🔥 GESTIÓN DE USUARIOS CARGADO CORRECTAMENTE 🔥         ║
╠══════════════════════════════════════════════════════════════╣
║  • cargarUsuarios()       renderUsuarios()                   ║
║  • viewUsuario(id)        editUsuario(id)                    ║
║  • guardarEdicionMiembro() guardarNuevoUsuario()             ║
║  • handleFotoSeleccionada() eliminarFotoMiembro(id)          ║
║  • agregarCertificacion()  quitarCertificacion(i)            ║
║  • guardarCursosMiembro(id)                                  ║
║  • confirmarEliminarMiembroFisico(id)                        ║
╚══════════════════════════════════════════════════════════════╝
`);

// ══════════════════════════════════════════════════════════════════
// PREVIEW FOTO — modal AGREGAR
// ══════════════════════════════════════════════════════════════════
function handleAddFotoPreview(input) {
    if (!input.files?.[0]) return;
    const archivo = input.files[0];
    if (!["image/jpeg","image/png","image/webp"].includes(archivo.type)) {
        mostrarAlertaModal("Solo se permiten imágenes JPG, PNG o WEBP.", "error");
        input.value = ""; return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
        mostrarAlertaModal("La foto supera el máximo de 2 MB.", "error");
        input.value = ""; return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const img = document.getElementById("addFotoPreview");
        if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(archivo);
}