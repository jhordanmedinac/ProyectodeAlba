// ============================================
// CGPVP - GESTIÓN DE CURSOS VÍA API
// Consumo de endpoints: /api/admin/cursos
// 🔥 VERSIÓN 2.0 - SOBRESCRIBE FUNCIONES DE LOCALSTORAGE
// ============================================

console.log('🔵 Cargando cursos-api.js v2.0...');

const API_BASE_CURSOS = 'https://paramedicosdelperu.org/api/admin/cursos';

// Variables globales
let cursosPaginaActual = 1;
const cursosPorPagina = 10;
let cursosFiltros = { busqueda: '', categoria: '', modalidad: '', estado: '' };
let instructoresDisponibles = []; // Cache de instructores

// ============================================
// FUNCIONES AUXILIARES DE FECHAS
// ============================================

// Formatear fecha desde SQL Server a formato legible
function formatearFecha(fecha) {
    if (!fecha) return '-';
    
    try {
        // Si viene como string "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SS"
        const fechaObj = new Date(fecha);
        
        // Verificar que sea una fecha válida
        if (isNaN(fechaObj.getTime())) return fecha; // Devolver el valor original si no es válida
        
        // Formatear a DD/MM/YYYY
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const anio = fechaObj.getFullYear();
        
        return `${dia}/${mes}/${anio}`;
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return fecha; // Devolver el valor original en caso de error
    }
}

// Convertir fecha a formato para input type="date" (YYYY-MM-DD)
function fechaParaInput(fecha) {
    if (!fecha) return '';
    
    try {
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) return '';
        
        // Formatear a YYYY-MM-DD
        const anio = fechaObj.getFullYear();
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        
        return `${anio}-${mes}-${dia}`;
    } catch (error) {
        console.error('Error al convertir fecha para input:', error);
        return '';
    }
}

// 🔥 NUEVO: Limpiar y validar fecha del input (corrige el bug del "52003")
function limpiarFechaInput(fechaRaw) {
    if (!fechaRaw) return null;
    
    // Limpiar espacios
    let fecha = fechaRaw.trim();
    
    console.log('🔍 Fecha raw del input:', fechaRaw);
    
    // Si tiene formato correcto YYYY-MM-DD, validar y devolver
    const regexFechaCorrecta = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = fecha.match(regexFechaCorrecta);
    
    if (match) {
        const anio = parseInt(match[1]);
        const mes = parseInt(match[2]);
        const dia = parseInt(match[3]);
        
        // Validar rangos
        if (anio < 1900 || anio > 2100) {
            console.warn('⚠️ Año fuera de rango:', anio);
            return null;
        }
        if (mes < 1 || mes > 12) {
            console.warn('⚠️ Mes fuera de rango:', mes);
            return null;
        }
        if (dia < 1 || dia > 31) {
            console.warn('⚠️ Día fuera de rango:', dia);
            return null;
        }
        
        console.log('✅ Fecha válida:', fecha);
        return fecha;
    }
    
    // Si tiene el bug "52003-04-23", intentar corregir
    const regexFechaMalFormada = /^(\d{5,})-(\d{2})-(\d{2})$/;
    const matchMalFormada = fecha.match(regexFechaMalFormada);
    
    if (matchMalFormada) {
        const anioMalformado = matchMalFormada[1];
        const mes = matchMalFormada[2];
        const dia = matchMalFormada[3];
        
        console.warn('⚠️ Fecha mal formada detectada:', fecha);
        
        // Intentar extraer el año correcto (últimos 4 dígitos)
        const anioCorregido = anioMalformado.slice(-4);
        const fechaCorregida = `${anioCorregido}-${mes}-${dia}`;
        
        console.log('🔧 Fecha corregida:', fechaCorregida);
        return fechaCorregida;
    }
    
    console.error('❌ Formato de fecha no reconocido:', fecha);
    return null;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// 1. Cargar cursos con filtros y paginación
async function cargarCursosDesdeAPI() {
    console.log('🔵 [CURSOS API] Cargando cursos desde API...');

    try {
        const response = await fetch(`${API_BASE_CURSOS}/listar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                busqueda: cursosFiltros.busqueda || null,
                categoria: cursosFiltros.categoria || null,
                modalidad: cursosFiltros.modalidad || null,
                estado: cursosFiltros.estado || null
            })
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const cursos = data.resultados || [];

        // Paginación manual en el frontend
        const inicio = (cursosPaginaActual - 1) * cursosPorPagina;
        const fin = inicio + cursosPorPagina;
        const cursosPaginados = cursos.slice(inicio, fin);

        console.log('✅ Cursos encontrados:', cursos.length, '| Mostrando:', cursosPaginados.length);

        renderCursosAPI(cursosPaginados);
        renderPaginacionCursos(cursos.length, cursosPaginaActual);

    } catch (error) {
        console.error('❌ Error al cargar cursos:', error);
        if (typeof showToast === 'function') showToast('Error al cargar cursos', 'error');
        renderCursosAPI([]);
    }
}

// 2. Renderizar tabla de cursos (VERSIÓN RESPONSIVE MEJORADA)
function renderCursosAPI(cursos) {
    const tbody = document.querySelector('#cursos tbody');
    if (!tbody) return;

    if (!cursos || cursos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                    <span style="color: #666;">No se encontraron cursos</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cursos.map(curso => {
        const idCurso = curso.id_curso || curso.id || 0;
        const titulo = curso.titulo || 'Sin título';
        const categoria = curso.categoria || '-';
        const duracion = curso.duracion || '-';
        const modalidad = curso.modalidad || '-';
        const instructor = curso.instructor || curso.nombre_instructor || 'Sin asignar';
        const estado = curso.estado || '-';
        
        // Determinar ícono según modalidad
        let iconoModalidad = 'building';
        if (modalidad === 'Virtual') iconoModalidad = 'laptop';
        else if (modalidad === 'Semipresencial') iconoModalidad = 'building-columns';
        
        // Determinar clase del estado
        const estadoClass = estado === 'Activo' ? 'active' : 
                           estado === 'Finalizado' ? 'completed' : 'inactive';
        
        return `
            <tr data-curso-id="${idCurso}">
                <td data-label="ID">${idCurso}</td>
                <td data-label="Curso">
                    <div class="curso-info">
                        <div class="curso-titulo">${titulo}</div>
                        <small class="curso-categoria">${categoria}</small>
                    </div>
                </td>
                <td data-label="Duración">
                    <span class="duracion-badge">${duracion}</span>
                </td>
                <td data-label="Modalidad">
                    <div class="modalidad-cell">
                        <i class="fas fa-${iconoModalidad}"></i>
                        <span>${modalidad}</span>
                    </div>
                </td>
                <td data-label="Instructor">
                    <div class="instructor-cell">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${instructor}</span>
                    </div>
                </td>
                <td data-label="Estado">
                    <span class="status-badge status-${estadoClass}">
                        ${estado}
                    </span>
                </td>
                <td data-label="Acciones" class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="verDetalleCursoAPI(${idCurso})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editarCursoAPI(${idCurso})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="confirmarEliminarCursoAPI(${idCurso})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 3. Renderizar paginación (VERSIÓN RESPONSIVE MEJORADA)
function renderPaginacionCursos(total, paginaActual) {
    const totalPaginas = Math.ceil(total / cursosPorPagina);
    const container = document.querySelector('#cursos .pagination-container');
    if (!container) return;

    const inicio = (paginaActual - 1) * cursosPorPagina + 1;
    const fin = Math.min(paginaActual * cursosPorPagina, total);

    const infoEl = container.querySelector('.pagination-info');
    if (infoEl) {
        infoEl.textContent = `Mostrando ${total > 0 ? inicio : 0} a ${fin} de ${total} resultado${total !== 1 ? 's' : ''}`;
    }

    const controlsEl = container.querySelector('.pagination-controls');
    if (!controlsEl) return;

    // Botón anterior
    let html = `<button class="pagination-btn" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPaginaCursosAPI(${paginaActual - 1})" title="Anterior">
        <i class="fas fa-chevron-left"></i>
    </button>`;

    // Lógica de páginas para mostrar
    const paginas = [];
    const isMobile = window.innerWidth <= 575;
    const maxPaginasVisible = isMobile ? 3 : 7;
    
    if (totalPaginas <= maxPaginasVisible) {
        // Mostrar todas las páginas
        for (let i = 1; i <= totalPaginas; i++) {
            paginas.push(i);
        }
    } else {
        // Mostrar páginas con elipsis
        paginas.push(1);
        
        if (paginaActual > (isMobile ? 2 : 3)) {
            paginas.push('...');
        }
        
        const rango = isMobile ? 0 : 1;
        for (let i = Math.max(2, paginaActual - rango); i <= Math.min(totalPaginas - 1, paginaActual + rango); i++) {
            if (!paginas.includes(i)) {
                paginas.push(i);
            }
        }
        
        if (paginaActual < totalPaginas - (isMobile ? 1 : 2)) {
            paginas.push('...');
        }
        
        if (!paginas.includes(totalPaginas)) {
            paginas.push(totalPaginas);
        }
    }

    // Renderizar botones de páginas
    paginas.forEach(p => {
        if (p === '...') {
            html += `<button class="pagination-btn" disabled>...</button>`;
        } else {
            html += `<button class="pagination-btn ${p === paginaActual ? 'active' : ''}" onclick="cambiarPaginaCursosAPI(${p})" title="Página ${p}">${p}</button>`;
        }
    });

    // Botón siguiente
    html += `<button class="pagination-btn" ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''} onclick="cambiarPaginaCursosAPI(${paginaActual + 1})" title="Siguiente">
        <i class="fas fa-chevron-right"></i>
    </button>`;

    controlsEl.innerHTML = html;
}

function cambiarPaginaCursosAPI(nuevaPagina) {
    cursosPaginaActual = nuevaPagina;
    cargarCursosDesdeAPI();
    
    // Scroll suave hacia arriba en móvil
    if (window.innerWidth <= 767) {
        const seccionCursos = document.getElementById('cursos');
        if (seccionCursos) {
            seccionCursos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 4. Aplicar y limpiar filtros
function aplicarFiltrosCursosAPI() {
    cursosFiltros.busqueda = document.getElementById('cursoBusqueda')?.value || '';
    cursosFiltros.categoria = document.getElementById('cursoCategoria')?.value || '';
    cursosFiltros.modalidad = document.getElementById('cursoModalidad')?.value || '';
    cursosFiltros.estado = document.getElementById('cursoEstado')?.value || '';
    cursosPaginaActual = 1;
    cargarCursosDesdeAPI();
}

function limpiarFiltrosCursosAPI() {
    ['cursoBusqueda', 'cursoCategoria', 'cursoModalidad', 'cursoEstado'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    cursosFiltros = { busqueda: '', categoria: '', modalidad: '', estado: '' };
    cursosPaginaActual = 1;
    cargarCursosDesdeAPI();
}

// 5. Ver detalle del curso
async function verDetalleCursoAPI(idCurso) {
    console.log('🔵 [CURSOS API] Ver detalle curso:', idCurso);
    try {
        const response = await fetch(`${API_BASE_CURSOS}/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_curso: idCurso })
        });

        if (!response.ok) throw new Error('Curso no encontrado');
        const data = await response.json();
        const curso = data.resultados?.[0] || {};

        const html = `
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;">
                <div><strong>Título:</strong><br>${curso.titulo || '-'}</div>
                <div><strong>Duración:</strong><br>${curso.duracion || '-'}</div>
                <div><strong>Modalidad:</strong><br>${curso.modalidad || '-'}</div>
                <div><strong>Instructor:</strong><br>${curso.instructor || curso.nombre_instructor || 'Sin asignar'}</div>
                <div><strong>Estado:</strong><br>${curso.estado || '-'}</div>
                <div><strong>Fechas:</strong><br>${formatearFecha(curso.fecha_inicio)} al ${formatearFecha(curso.fecha_fin)}</div>
                <div style="grid-column:1/-1;"><strong>Descripción:</strong><br>${curso.descripcion || 'Sin descripción'}</div>
                <div style="grid-column:1/-1;"><strong>Requisitos:</strong><br>${curso.requisitos || 'Ninguno'}</div>
                ${curso.direccion ? `<div style="grid-column:1/-1;"><strong>Dirección:</strong><br>${curso.direccion}</div>` : ''}
                ${curso.enlace ? `<div style="grid-column:1/-1;"><strong>Enlace:</strong><br><a href="${curso.enlace}" target="_blank">${curso.enlace}</a></div>` : ''}
            </div>
        `;

        if (typeof showDynModal === 'function') {
            showDynModal(`📚 Curso #${idCurso}`, html);
        } else {
            alert(html.replace(/<[^>]*>/g, '\n'));
        }

    } catch (error) {
        console.error('❌ Error:', error);
        if (typeof showToast === 'function') showToast('Error al cargar curso', 'error');
    }
}

// 6. Abrir modal para nuevo curso
async function abrirModalNuevoCursoAPI() {
    console.log('🔵 [CURSOS API] Abriendo modal nuevo curso...');
    
    // Cargar instructores disponibles primero
    await cargarInstructoresParaSelect();
    
    // Limpiar formulario
    const form = document.getElementById('formNuevoCurso');
    if (form) form.reset();
    
    // Poblar select de instructores
    const selectInstructor = document.getElementById('nuevoCursoInstructor');
    if (selectInstructor) {
        selectInstructor.innerHTML = '<option value="">Sin asignar</option>';
        
        if (instructoresDisponibles.length > 0) {
            instructoresDisponibles.forEach(inst => {
                // 🔥 CORREGIDO: Usar los nombres de columnas correctos del backend
                const id = inst.id_instructor ?? inst.ID_Instructor ?? inst.Id_Instructor ?? inst.id ?? inst.ID;
                const nombreCompleto = inst.nombre_completo ?? inst.Nombre_Completo ?? null;
                const nombreApellido = inst.nombre && inst.apellido ? `${inst.nombre} ${inst.apellido}` : null;
                const nombre = nombreCompleto || nombreApellido || 'Sin nombre';
                
                console.log(`📋 Instructor: ID=${id}, Nombre=${nombre}`);
                
                selectInstructor.innerHTML += `<option value="${id}">${nombre}</option>`;
            });
            console.log(`✅ Select poblado con ${instructoresDisponibles.length} instructores`);
        } else {
            console.warn('⚠️ No hay instructores disponibles');
            selectInstructor.innerHTML += '<option value="" disabled>No hay instructores disponibles</option>';
        }
    }
    
    // Abrir modal
    if (typeof openModal === 'function') {
        openModal('modalNuevoCurso');
        console.log('✅ Modal abierto');
    } else {
        console.error('❌ Función openModal no existe');
        alert('Error: Modal no disponible');
    }
}

// 7. Guardar nuevo curso - FUNCIÓN PRINCIPAL QUE SE LLAMA DESDE EL BOTÓN
async function guardarNuevoCurso() {
    console.log('🔥 [CURSOS API] ¡guardarNuevoCurso() LLAMADA DESDE LA API!');
    
    try {
        // Obtener valores del formulario
        const titulo = document.getElementById('nuevoCursoTitulo')?.value.trim();
        const duracion = document.getElementById('nuevoCursoDuracion')?.value.trim();
        const modalidad = document.getElementById('nuevoCursoModalidad')?.value;
        const id_instructor = document.getElementById('nuevoCursoInstructor')?.value;
        const descripcion = document.getElementById('nuevoCursoDescripcion')?.value.trim();
        const requisitos = document.getElementById('nuevoCursoRequisitos')?.value.trim();
        
        // 🔥 CORREGIDO: Limpiar fechas antes de usarlas
        const fecha_inicio_raw = document.getElementById('nuevoCursoFechaInicio')?.value;
        const fecha_fin_raw = document.getElementById('nuevoCursoFechaFin')?.value;
        const fecha_inicio = limpiarFechaInput(fecha_inicio_raw);
        const fecha_fin = limpiarFechaInput(fecha_fin_raw);
        
        // ✅ NUEVO: Capturar dirección y enlace (si existen en el HTML)
        const direccion = document.getElementById('nuevoCursoDireccion')?.value.trim();
        const enlace = document.getElementById('nuevoCursoEnlace')?.value.trim();

        console.log('📋 Valores obtenidos:', { titulo, duracion, modalidad, id_instructor, direccion, enlace, fecha_inicio, fecha_fin });

        // Validaciones
        if (!titulo) {
            if (typeof showToast === 'function') showToast('El título es obligatorio', 'error');
            else alert('El título es obligatorio');
            return;
        }
        
        // ✅ VALIDACIÓN ADICIONAL: Si es Virtual o Semipresencial, requiere enlace
        if ((modalidad === 'Virtual' || modalidad === 'Semipresencial') && !enlace) {
            if (typeof showToast === 'function') showToast('Los cursos virtuales/semipresenciales requieren un enlace', 'error');
            else alert('Los cursos virtuales/semipresenciales requieren un enlace');
            return;
        }
        
        // ✅ VALIDACIÓN ADICIONAL: Si es Presencial, requiere dirección
        if (modalidad === 'Presencial' && !direccion) {
            if (typeof showToast === 'function') showToast('Los cursos presenciales requieren una dirección', 'error');
            else alert('Los cursos presenciales requieren una dirección');
            return;
        }

        // Preparar datos
        const nuevoCurso = {
            titulo,
            categoria: "B?sico",  // ✅ Usar categoría válida del constraint
            duracion: duracion || null,
            modalidad,
            id_instructor: id_instructor ? parseInt(id_instructor) : null,
            descripcion: descripcion || null,
            requisitos: requisitos || null,
            cupos: 0,  // ✅ Valor por defecto
            direccion: direccion || null,  // ✅ Ahora captura el valor real
            enlace: enlace || null,        // ✅ Ahora captura el valor real
            imagen: null,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
            admin_id: 1  // 🔥 CAMBIAR por el ID real del admin logueado
        };

        console.log('📤 Enviando a API:', nuevoCurso);

        // POST a la API
        const response = await fetch(`${API_BASE_CURSOS}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoCurso)
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }

        const data = await response.json();
        console.log('✅ Respuesta del servidor:', data);

        // Cerrar modal
        if (typeof closeModal === 'function') {
            closeModal('modalNuevoCurso');
            console.log('✅ Modal cerrado');
        }
        
        // Mostrar mensaje de éxito
        if (typeof showToast === 'function') {
            showToast(data.mensaje || 'Curso creado exitosamente', 'success');
        } else {
            alert(data.mensaje || 'Curso creado exitosamente');
        }

        // Recargar lista
        cargarCursosDesdeAPI();

    } catch (error) {
        console.error('❌ Error al guardar curso:', error);
        if (typeof showToast === 'function') {
            showToast('Error al crear curso: ' + error.message, 'error');
        } else {
            alert('Error al crear curso: ' + error.message);
        }
    }
}

// 8. Editar curso
async function editarCursoAPI(idCurso) {
    console.log('🔵 [CURSOS API] Editando curso:', idCurso);
    try {
        // Cargar datos del curso
        const response = await fetch(`${API_BASE_CURSOS}/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_curso: idCurso })
        });

        if (!response.ok) throw new Error('Curso no encontrado');
        const data = await response.json();
        const curso = data.resultados?.[0] || {};

        // Cargar instructores
        await cargarInstructoresParaSelect();

        // Poblar formulario de edición
        document.getElementById('editCursoId').value = curso.id_curso || curso.id;
        document.getElementById('editCursoTitulo').value = curso.titulo || '';
        document.getElementById('editCursoDuracion').value = curso.duracion || '';
        document.getElementById('editCursoModalidad').value = curso.modalidad || 'Presencial';
        document.getElementById('editCursoDescripcion').value = curso.descripcion || '';
        document.getElementById('editCursoRequisitos').value = curso.requisitos || '';
        document.getElementById('editCursoDireccion').value = curso.direccion || '';
        document.getElementById('editCursoEnlace').value = curso.enlace || '';
        document.getElementById('editCursoEstado').value = curso.estado || 'Activo';
        // 🔥 CORREGIDO: Usar fechaParaInput para formato YYYY-MM-DD
        document.getElementById('editCursoFechaInicio').value = fechaParaInput(curso.fecha_inicio);
        document.getElementById('editCursoFechaFin').value = fechaParaInput(curso.fecha_fin);

        // Poblar select de instructores
        const selectInstructor = document.getElementById('editCursoInstructor');
        if (selectInstructor) {
            selectInstructor.innerHTML = '<option value="">Sin asignar</option>';
            
            instructoresDisponibles.forEach(inst => {
                // 🔥 CORREGIDO: Usar los nombres de columnas correctos
                const instId = inst.id_instructor ?? inst.ID_Instructor ?? inst.Id_Instructor ?? inst.id ?? inst.ID;
                const nombreCompleto = inst.nombre_completo ?? inst.Nombre_Completo ?? null;
                const nombreApellido = inst.nombre && inst.apellido ? `${inst.nombre} ${inst.apellido}` : null;
                const instNombre = nombreCompleto || nombreApellido || 'Sin nombre';
                const selected = instId == curso.id_instructor ? 'selected' : '';
                
                selectInstructor.innerHTML += `<option value="${instId}" ${selected}>${instNombre}</option>`;
            });
        }

        // Abrir modal de edición
        if (typeof openModal === 'function') {
            openModal('modalEditarCurso');
        }

        // 🔥 NUEVO: Ejecutar toggle después de abrir el modal
        setTimeout(() => {
            if (typeof toggleCamposModalidadEdit === 'function') {
                toggleCamposModalidadEdit();
            }
        }, 100);

    } catch (error) {
        console.error('❌ Error:', error);
        if (typeof showToast === 'function') showToast('Error al cargar curso', 'error');
    }
}

// 9. Actualizar curso
async function actualizarCursoAPI() {
    console.log('🔵 [CURSOS API] Actualizando curso...');
    try {
        const id_curso = parseInt(document.getElementById('editCursoId')?.value);
        const titulo = document.getElementById('editCursoTitulo')?.value.trim();
        const duracion = document.getElementById('editCursoDuracion')?.value.trim();
        const modalidad = document.getElementById('editCursoModalidad')?.value;
        const id_instructor = document.getElementById('editCursoInstructor')?.value;
        const descripcion = document.getElementById('editCursoDescripcion')?.value.trim();
        const requisitos = document.getElementById('editCursoRequisitos')?.value.trim();
        const direccion = document.getElementById('editCursoDireccion')?.value.trim();
        const enlace = document.getElementById('editCursoEnlace')?.value.trim();
        const estado = document.getElementById('editCursoEstado')?.value;
        
        // 🔥 CORREGIDO: Limpiar fechas antes de usarlas
        const fecha_inicio_raw = document.getElementById('editCursoFechaInicio')?.value;
        const fecha_fin_raw = document.getElementById('editCursoFechaFin')?.value;
        const fecha_inicio = limpiarFechaInput(fecha_inicio_raw);
        const fecha_fin = limpiarFechaInput(fecha_fin_raw);

        // Validaciones
        if (!titulo) {
            if (typeof showToast === 'function') showToast('El título es obligatorio', 'error');
            return;
        }

        const cursoActualizado = {
            id_curso,
            titulo,
            categoria: "B?sico",  // ✅ Usar categoría válida del constraint
            duracion: duracion || null,
            modalidad,
            id_instructor: id_instructor ? parseInt(id_instructor) : null,
            descripcion: descripcion || null,
            requisitos: requisitos || null,
            cupos: 0,  // ✅ Valor por defecto
            direccion: direccion || null,
            enlace: enlace || null,
            imagen: null,
            estado,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
            admin_id: 1  // 🔥 Cambiar por el ID real del admin
        };

        console.log('📤 Actualizando curso:', cursoActualizado);

        const response = await fetch(`${API_BASE_CURSOS}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cursoActualizado)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }

        const data = await response.json();
        console.log('✅ Curso actualizado:', data);

        if (typeof closeModal === 'function') closeModal('modalEditarCurso');
        
        if (typeof showToast === 'function') {
            showToast(data.mensaje || 'Curso actualizado exitosamente', 'success');
        }

        cargarCursosDesdeAPI();

    } catch (error) {
        console.error('❌ Error al actualizar curso:', error);
        if (typeof showToast === 'function') {
            showToast('Error al actualizar curso: ' + error.message, 'error');
        }
    }
}

// 10. Confirmar y eliminar curso — modal personalizado
function confirmarEliminarCursoAPI(idCurso) {
    // Buscar datos del curso en el DOM para mostrarlos
    const fila = document.querySelector(`tr[data-curso-id="${idCurso}"]`);
    const titulo    = fila?.querySelector('.curso-titulo')?.textContent   || `Curso #${idCurso}`;
    const categoria = fila?.querySelector('.curso-categoria')?.textContent || '—';
    const modalidad = fila?.querySelector('.modalidad-cell span')?.textContent || '—';

    const msgEl = document.querySelector('#deleteCursoModal .del-curso-message');
    if (msgEl) {
        msgEl.innerHTML = `
            <div style="text-align:center;">
                <div class="del-curso-avatar">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h3 class="del-curso-title">¿Eliminar este curso?</h3>
                <p class="del-curso-subtitle">Estás a punto de <strong>eliminar permanentemente</strong> el curso:</p>
                <div class="del-curso-info-card">
                    <p><strong>Título:</strong> <span>${titulo}</span></p>
                    <p><strong>Categoría:</strong> <span>${categoria}</span></p>
                    <p><strong>Modalidad:</strong> <span>${modalidad}</span></p>
                </div>
                <div class="del-curso-warning-box">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Esta acción NO SE PUEDE DESHACER. Se eliminarán todos los datos del curso.</p>
                </div>
            </div>`;
    }

    const modal = document.getElementById('deleteCursoModal');
    if (modal) modal.dataset.cursoId = idCurso;
    if (typeof openModal === 'function') openModal('deleteCursoModal');
}

async function confirmarEliminarCursoDefinitivo() {
    const modal   = document.getElementById('deleteCursoModal');
    const idCurso = modal?.dataset.cursoId;
    if (!idCurso) return;

    const btn = document.getElementById('btnConfirmDeleteCurso');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'; }

    await eliminarCursoAPI(parseInt(idCurso));

    if (typeof closeModal === 'function') closeModal('deleteCursoModal');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar'; }
}

async function eliminarCursoAPI(idCurso) {
    console.log('🔵 [CURSOS API] Eliminando curso:', idCurso);
    try {
        const response = await fetch(`${API_BASE_CURSOS}/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_curso: idCurso,
                admin_id: 1  // 🔥 Cambiar por el ID real del admin
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }

        const data = await response.json();
        console.log('✅ Curso eliminado:', data);

        if (typeof showToast === 'function') {
            showToast(data.mensaje || 'Curso eliminado exitosamente', 'success');
        }

        cargarCursosDesdeAPI();

    } catch (error) {
        console.error('❌ Error al eliminar curso:', error);
        if (typeof showToast === 'function') {
            showToast('Error al eliminar curso: ' + error.message, 'error');
        }
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================



async function cargarInstructoresParaSelect() {
    try {
        console.log('🔵 [INSTRUCTORES] Cargando instructores...');
        
        // ✅ CORREGIDO: Usar GET sin /listar (según instructores-api.js)
        const response = await fetch('https://paramedicosdelperu.org/api/admin/instructores/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error HTTP:', response.status, errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta completa del servidor:', data);
        
        // El endpoint devuelve { status: 'SUCCESS', data: [...], total: X }
        instructoresDisponibles = data.data || data.resultados || [];
        
        console.log(`✅ Instructores cargados: ${instructoresDisponibles.length}`);
        
        // 🔍 DEBUG: Mostrar el primer instructor para ver la estructura
        if (instructoresDisponibles.length > 0) {
            console.log('📋 Ejemplo de instructor (primero):', instructoresDisponibles[0]);
            console.log('📋 Columnas disponibles:', Object.keys(instructoresDisponibles[0]));
        } else {
            console.warn('⚠️ No se encontraron instructores en la respuesta');
        }

    } catch (error) {
        console.error('❌ Error al cargar instructores:', error);
        instructoresDisponibles = [];
    }
}

// ============================================
// SOBRESCRIBIR FUNCIONES DE LOCALSTORAGE
// ============================================
console.log('🔥 Sobrescribiendo funciones de localStorage con versiones API...');

// Sobrescribir renderCursos (del admin-script.js)
window.renderCursos = cargarCursosDesdeAPI;

// Sobrescribir viewCurso (del admin-script.js)
window.viewCurso = verDetalleCursoAPI;

// Sobrescribir editCurso (del admin-script.js)
window.editCurso = editarCursoAPI;

// Sobrescribir deleteCurso (del admin-script.js)
window.deleteCurso = confirmarEliminarCursoAPI;

// Sobrescribir showAddCursoModal (del admin-script.js)
window.showAddCursoModal = abrirModalNuevoCursoAPI;

// Sobrescribir abrirModalNuevoCurso (puede ser llamada desde el HTML)
window.abrirModalNuevoCurso = abrirModalNuevoCursoAPI;

// Sobrescribir verDetalleCurso (puede ser llamada desde el HTML)
window.verDetalleCurso = verDetalleCursoAPI;

// Sobrescribir editarCurso (puede ser llamada desde el HTML)
window.editarCurso = editarCursoAPI;

// Sobrescribir confirmarEliminarCurso (puede ser llamada desde el HTML)
window.confirmarEliminarCurso = confirmarEliminarCursoAPI;

// Sobrescribir eliminarCurso (puede ser llamada desde el HTML)
window.eliminarCurso = eliminarCursoAPI;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 [CURSOS API] Inicializando...');
    
    // Botones de filtro
    const btnFiltrar = document.getElementById('btnFiltrarCursos');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', aplicarFiltrosCursosAPI);
        console.log('✅ Botón filtrar conectado');
    }

    const btnLimpiar = document.getElementById('btnLimpiarFiltrosCursos');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltrosCursosAPI);
        console.log('✅ Botón limpiar conectado');
    }

    // Búsqueda en tiempo real
    const busquedaInput = document.getElementById('cursoBusqueda');
    if (busquedaInput) {
        let timeoutId;
        busquedaInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(aplicarFiltrosCursosAPI, 500);
        });
        console.log('✅ Búsqueda en tiempo real conectada');
    }

    // Cargar cursos si la sección está activa
    const seccionCursos = document.getElementById('cursos');
    if (seccionCursos && seccionCursos.classList.contains('active')) {
        console.log('✅ Sección cursos activa, cargando...');
        cargarCursosDesdeAPI();
    }
});

// ============================================
// EXPORTAR FUNCIONES AL SCOPE GLOBAL
// ============================================
window.cargarCursosDesdeAPI          = cargarCursosDesdeAPI;
window.abrirModalNuevoCursoAPI       = abrirModalNuevoCursoAPI;
window.abrirModalNuevoCurso          = abrirModalNuevoCursoAPI;
window.guardarNuevoCurso             = guardarNuevoCurso;
window.verDetalleCursoAPI            = verDetalleCursoAPI;
window.editarCursoAPI                = editarCursoAPI;
window.actualizarCursoAPI            = actualizarCursoAPI;
window.actualizarCurso               = actualizarCursoAPI;
window.confirmarEliminarCursoAPI     = confirmarEliminarCursoAPI;
window.confirmarEliminarCursoDefinitivo = confirmarEliminarCursoDefinitivo;
window.eliminarCursoAPI              = eliminarCursoAPI;
window.cambiarPaginaCursosAPI        = cambiarPaginaCursosAPI;
window.aplicarFiltrosCursosAPI       = aplicarFiltrosCursosAPI;
window.limpiarFiltrosCursosAPI       = limpiarFiltrosCursosAPI;