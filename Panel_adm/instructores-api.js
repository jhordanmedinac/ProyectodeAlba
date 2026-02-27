// ============================================
// CGPVP - GESTIÓN DE INSTRUCTORES (API)
// Consumo de endpoints: /api/admin/instructores
// ============================================

// Configuración de la API
const INSTRUCTORES_API = {
    BASE_URL: 'https://paramedicosdelperu.org/api/admin/instructores',
    // ✅ FIX: Lee admin_id desde localStorage en lugar de hardcodear 1
    get ADMIN_ID() {
        return parseInt(localStorage.getItem('admin_id') || '1', 10);
    }
};

// Estado global de instructores
const INSTRUCTORES_STATE = {
    data: [],
    filteredData: [],
    currentPage: 1,
    itemsPerPage: 9,
    totalItems: 0,
    filters: {
        busqueda: '',
        especialidad: '',
        estado: ''
    },
    loading: false
};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function () {

    // ✅ FIX: La sección está oculta al inicio, así que nos enganchamos
    // al sistema de navegación del sidebar para cargar cuando se activa.
    const navItemInstructores = document.querySelector('.nav-item[data-section="instructores"]');
    if (navItemInstructores) {
        navItemInstructores.addEventListener('click', function () {
            // Solo carga si todavía no hay datos (evita recargas innecesarias)
            if (INSTRUCTORES_STATE.data.length === 0) {
                cargarInstructoresCompleto();
            }
        });
    }

    // Inicializar filtros (funciona aunque la sección esté oculta)
    initInstructoresFilters();
});

// ✅ ALIAS: El HTML llama showAddInstructorModal(), el JS tenía mostrarModalNuevoInstructor()
function showAddInstructorModal() {
    mostrarModalNuevoInstructor();
}

// ============================================
// 1. CARGAR INSTRUCTORES DESDE LA API
// ============================================
async function cargarInstructoresCompleto() {
    try {
        INSTRUCTORES_STATE.loading = true;
        mostrarLoadingInstructores(true);

        const params = new URLSearchParams();
        if (INSTRUCTORES_STATE.filters.busqueda)     params.append('busqueda',    INSTRUCTORES_STATE.filters.busqueda);
        if (INSTRUCTORES_STATE.filters.especialidad) params.append('especialidad', INSTRUCTORES_STATE.filters.especialidad);
        if (INSTRUCTORES_STATE.filters.estado)       params.append('estado',       INSTRUCTORES_STATE.filters.estado);

        const url = `${INSTRUCTORES_API.BASE_URL}/?${params.toString()}`;
        console.log('🔍 Cargando instructores desde:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const resultado = await response.json();
        console.log('✅ Instructores cargados:', resultado);

        if (resultado.status === 'SUCCESS' && resultado.data) {
            INSTRUCTORES_STATE.data         = resultado.data;
            INSTRUCTORES_STATE.filteredData = resultado.data;
            INSTRUCTORES_STATE.totalItems   = resultado.total || resultado.data.length;
            INSTRUCTORES_STATE.currentPage  = 1;

            renderInstructoresAPI();
            actualizarPaginacionInstructores();
        } else {
            throw new Error('Formato de respuesta inválido');
        }

    } catch (error) {
        console.error('❌ Error al cargar instructores:', error);
        showToast('Error al cargar instructores: ' + error.message, 'error');
        renderInstructoresVacio('Error al cargar los datos. Intenta de nuevo.');
    } finally {
        INSTRUCTORES_STATE.loading = false;
        mostrarLoadingInstructores(false);
    }
}

// ============================================
// 2. RENDERIZAR INSTRUCTORES EN EL DOM
// ============================================
function renderInstructoresAPI() {
    const container = document.getElementById('instructores');
    if (!container) return;

    const grid = container.querySelector('.events-grid');
    if (!grid) return;

    const data = INSTRUCTORES_STATE.filteredData;

    if (data.length === 0) {
        renderInstructoresVacio('No se encontraron instructores');
        return;
    }

    // Paginación client-side
    const startIdx      = (INSTRUCTORES_STATE.currentPage - 1) * INSTRUCTORES_STATE.itemsPerPage;
    const endIdx        = startIdx + INSTRUCTORES_STATE.itemsPerPage;
    const paginatedData = data.slice(startIdx, endIdx);

    grid.innerHTML = paginatedData.map(instructor => {
        // 🔍 DEBUG: Ver qué columnas vienen del backend
        console.log('📋 Columnas del instructor:', Object.keys(instructor));
        
        // Intentar múltiples variantes del nombre de la columna ID
        const id = instructor.id_instructor 
                ?? instructor.ID_Instructor 
                ?? instructor.Id_Instructor
                ?? instructor.id
                ?? instructor.ID;
        
        // ⚠️ Validar que tenemos un ID válido
        if (!id) {
            console.error('❌ Instructor sin ID válido:', instructor);
            return ''; // No renderizar esta tarjeta si no tiene ID
        }

        const nombre       = instructor.nombre_completo   ?? instructor.Nombre_Completo   ?? 'Sin nombre';
        const especialidad = instructor.especialidad      ?? instructor.Especialidad       ?? 'Sin especialidad';
        const rango        = instructor.rango             ?? instructor.Rango              ?? 'Sin rango';
        const expAnios     = instructor.experiencia_anios ?? instructor.Experiencia_Anios  ?? 0;
        const certs        = instructor.certificaciones   ?? instructor.Certificaciones    ?? 'Sin certificaciones';
        const email        = instructor.email             ?? instructor.Email              ?? 'Sin email';
        const estado       = instructor.estado            ?? instructor.Estado             ?? 'Inactivo';
        const foto         = instructor.foto              ?? instructor.Foto               ?? '';
        const estadoClass  = estado === 'Activo' ? 'programado' : 'cancelado';

        return `
            <div class="event-card" data-id="${id}">
                ${foto ? `
                <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${foto}" alt="${nombre}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--gold);">
                </div>
                ` : ''}
                <div class="event-header">
                    <span class="event-type">${especialidad}</span>
                    <span class="event-status status-${estadoClass}">${estado}</span>
                </div>
                <h3>${nombre}</h3>

                <div class="event-details">
                    <div class="event-detail">
                        <i class="fas fa-star"></i>
                        <span>${rango}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-clock"></i>
                        <span>${expAnios} año${expAnios !== 1 ? 's' : ''} de exp.</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-certificate"></i>
                        <span>${certs}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${email}</span>
                    </div>
                </div>

                <div class="event-actions">
                    <button class="btn-small btn-primary" onclick="verDetalleInstructorAPI(${id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-small btn-secondary" onclick="editarInstructorAPI(${id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-icon btn-delete" onclick="eliminarInstructorAPI(${id})" style="margin-left:auto;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderInstructoresVacio(mensaje) {
    const grid = document.querySelector('#instructores .events-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
            <i class="fas fa-chalkboard-teacher" style="font-size:64px; color:#ccc; margin-bottom:20px; display:block;"></i>
            <h3 style="color:#666; margin:0;">${mensaje}</h3>
        </div>
    `;
}

function mostrarLoadingInstructores(show) {
    const grid = document.querySelector('#instructores .events-grid');
    if (!grid || !show) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
            <div style="display:inline-flex; gap:8px; margin-bottom:16px;">
                <div style="width:12px; height:12px; background:var(--gold); border-radius:50%; animation:bounce 1s infinite;"></div>
                <div style="width:12px; height:12px; background:var(--navy); border-radius:50%; animation:bounce 1s infinite 0.2s;"></div>
                <div style="width:12px; height:12px; background:var(--gold); border-radius:50%; animation:bounce 1s infinite 0.4s;"></div>
            </div>
            <p style="color:#666; margin:0;">Cargando instructores...</p>
        </div>
    `;
}

// ============================================
// 3. VER DETALLE DE INSTRUCTOR (DATOS LOCALES)
// ============================================
function verDetalleInstructorAPI(idInstructor) {
    console.log('🔍 Buscando instructor con ID:', idInstructor);
    
    // Buscar el instructor en los datos ya cargados
    const instructor = INSTRUCTORES_STATE.data.find(i => {
        const id = i.id_instructor ?? i.ID_Instructor ?? i.Id_Instructor ?? i.id ?? i.ID;
        return id == idInstructor;
    });
    
    if (!instructor) {
        console.error('❌ Instructor no encontrado. ID buscado:', idInstructor);
        console.log('📊 IDs disponibles:', INSTRUCTORES_STATE.data.map(i => 
            i.id_instructor ?? i.ID_Instructor ?? i.Id_Instructor ?? i.id ?? i.ID
        ));
        showToast('No se encontró el instructor', 'error');
        return;
    }

    console.log('✅ Instructor encontrado:', instructor);

    const nombre   = instructor.nombre_completo   ?? instructor.Nombre_Completo  ?? '—';
    const rango    = instructor.rango             ?? instructor.Rango            ?? '—';
    const esp      = instructor.especialidad      ?? instructor.Especialidad     ?? '—';
    const exp      = instructor.experiencia_anios ?? instructor.Experiencia_Anios ?? 0;
    const certs    = instructor.certificaciones   ?? instructor.Certificaciones  ?? '—';
    const email    = instructor.email             ?? instructor.Email            ?? '—';
    const tel      = instructor.telefono          ?? instructor.Telefono         ?? '—';
    const estado   = instructor.estado            ?? instructor.Estado           ?? '—';
    const bio      = instructor.bio               ?? instructor.Bio              ?? '';
    const foto     = instructor.foto              ?? instructor.Foto             ?? '';

    showDynModal('Detalles del Instructor', `
        ${foto ? `
        <div style="text-align:center; margin-bottom:20px;">
            <img src="${foto}" alt="${nombre}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--gold); margin-bottom: 15px;">
        </div>
        ` : ''}
        <div style="text-align:center; margin-bottom:20px;">
            <h3 style="color:var(--navy); margin-bottom:5px;">${nombre}</h3>
            <p style="color:var(--gold); font-weight:600; margin:0;">${rango}</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:15px;">
            <div><b>🎓 Especialidad:</b><br>${esp}</div>
            <div><b>⏱️ Experiencia:</b><br>${exp} año${exp !== 1 ? 's' : ''}</div>
            <div><b>📜 Certificaciones:</b><br>${certs}</div>
            <div><b>📧 Email:</b><br>${email}</div>
            <div><b>📱 Teléfono:</b><br>${tel}</div>
            <div><b>✅ Estado:</b><br>
                <span style="color:${estado === 'Activo' ? '#43e97b' : '#e74c3c'}; font-weight:600;">${estado}</span>
            </div>
        </div>
        ${bio ? `<div style="background:#f8f9fa; padding:15px; border-radius:10px;"><b>📝 Biografía:</b><br><br>${bio}</div>` : ''}
    `);
}

// ============================================
// 4. CREAR NUEVO INSTRUCTOR
// ============================================
function mostrarModalNuevoInstructor() {
    const opcsEsp = _opcionesEspecialidad();

    showDynModal('Nuevo Instructor', `
        <form id="formNuevoInstructor" class="modal-form">
            <div class="form-group">
                <label>Nombre Completo <span class="required">*</span></label>
                <input type="text" id="instNombre" placeholder="Ej: Dr. Ricardo Torres Vega" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Especialidad <span class="required">*</span></label>
                    <select id="instEspecialidad" required>
                        <option value="">Seleccionar...</option>
                        ${opcsEsp}
                    </select>
                </div>
                <div class="form-group">
                    <label>Rango</label>
                    <input type="text" id="instRango" placeholder="Ej: Instructor Senior">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Años de Experiencia</label>
                    <input type="number" id="instExperiencia" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select id="instEstado">
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Certificaciones</label>
                <input type="text" id="instCertificaciones" placeholder="Ej: ACLS, PHTLS, ITLS">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="instEmail" placeholder="correo@cgpvp.pe">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" id="instTelefono" placeholder="999888777" maxlength="9">
                </div>
            </div>
            <div class="form-group">
                <label>Biografía</label>
                <textarea id="instBio" rows="3" placeholder="Breve descripción del instructor..."></textarea>
            </div>
            <div class="form-group">
                <label>Foto del Instructor</label>
                <input type="file" id="instFoto" accept="image/*" onchange="previsualizarFoto('instFoto', 'instFotoPreview')">
                <small class="form-text">Formatos: JPG, PNG, GIF. Tamaño máximo: 2MB</small>
            </div>
            <div class="form-group" id="instFotoPreviewContainer" style="display:none;">
                <label>Vista previa:</label>
                <img id="instFotoPreview" style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 10px; display: block;">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button>
                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Guardar</button>
            </div>
        </form>
    `, () => {
        document.getElementById('formNuevoInstructor').addEventListener('submit', guardarNuevoInstructorAPI);
    });
}

async function guardarNuevoInstructorAPI(event) {
    event.preventDefault();
    const btn = event.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const datos = {
        nombre_completo:   document.getElementById('instNombre').value.trim(),
        especialidad:      document.getElementById('instEspecialidad').value,
        rango:             document.getElementById('instRango').value.trim()            || null,
        experiencia_anios: parseInt(document.getElementById('instExperiencia').value)   || 0,
        certificaciones:   document.getElementById('instCertificaciones').value.trim()  || null,
        email:             document.getElementById('instEmail').value.trim()             || null,
        telefono:          document.getElementById('instTelefono').value.trim()          || null,
        foto:              null, // Se actualizará si se selecciona una foto
        bio:               document.getElementById('instBio').value.trim()               || null,
        admin_id:          INSTRUCTORES_API.ADMIN_ID
    };

    // Capturar la foto si fue seleccionada
    const fotoInput = document.getElementById('instFoto');
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        try {
            const fotoBase64 = await convertirImagenABase64(fotoInput.files[0]);
            datos.foto = fotoBase64;
        } catch (error) {
            console.error('Error al procesar la foto:', error);
            showToast('Error al procesar la imagen', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
            return;
        }
    }

    try {
        console.log('📤 Enviando nuevo instructor:', datos);
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos)
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        console.log('✅ Instructor creado:', resultado);

        if (resultado.status === 'SUCCESS') {
            showToast('Instructor agregado exitosamente', 'success');
            closeDynModal();
            await cargarInstructoresCompleto();
        } else {
            throw new Error(resultado.mensaje || 'Error al crear instructor');
        }
    } catch (error) {
        console.error('❌ Error al crear instructor:', error);
        showToast('Error al guardar: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
    }
}

// ============================================
// 5. EDITAR INSTRUCTOR
// ============================================
async function editarInstructorAPI(idInstructor) {
    try {
        console.log('📝 Cargando datos para editar instructor ID:', idInstructor);
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/${idInstructor}?admin_id=${INSTRUCTORES_API.ADMIN_ID}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        if (resultado.status !== 'SUCCESS' || !resultado.data) throw new Error('No se pudo obtener los datos');

        const ins = resultado.data;
        console.log('✅ Datos del instructor cargados:', ins);
        
        // Obtener ID con múltiples variantes
        const instructorId = ins.id_instructor ?? ins.ID_Instructor ?? ins.Id_Instructor ?? ins.id ?? ins.ID;
        const opcsEsp = _opcionesEspecialidad(ins.especialidad ?? ins.Especialidad);

        showDynModal('Editar Instructor', `
            <form id="formEditarInstructor" class="modal-form">
                <input type="hidden" id="editInstId" value="${instructorId}">
                <div class="form-group">
                    <label>Nombre Completo <span class="required">*</span></label>
                    <input type="text" id="editInstNombre" value="${ins.nombre_completo ?? ins.Nombre_Completo ?? ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Especialidad <span class="required">*</span></label>
                        <select id="editInstEspecialidad" required>
                            <option value="">Seleccionar...</option>
                            ${opcsEsp}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Rango</label>
                        <input type="text" id="editInstRango" value="${ins.rango ?? ins.Rango ?? ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Años de Experiencia</label>
                        <input type="number" id="editInstExperiencia" min="0" value="${ins.experiencia_anios ?? ins.Experiencia_Anios ?? 0}">
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="editInstEstado">
                            <option value="Activo"   ${(ins.estado ?? ins.Estado) === 'Activo'   ? 'selected' : ''}>Activo</option>
                            <option value="Inactivo" ${(ins.estado ?? ins.Estado) === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Certificaciones</label>
                    <input type="text" id="editInstCertificaciones" value="${ins.certificaciones ?? ins.Certificaciones ?? ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="editInstEmail" value="${ins.email ?? ins.Email ?? ''}">
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" id="editInstTelefono" value="${ins.telefono ?? ins.Telefono ?? ''}" maxlength="9">
                    </div>
                </div>
                <div class="form-group">
                    <label>Biografía</label>
                    <textarea id="editInstBio" rows="3">${ins.bio ?? ins.Bio ?? ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Foto del Instructor</label>
                    <input type="file" id="editInstFoto" accept="image/*" onchange="previsualizarFoto('editInstFoto', 'editInstFotoPreview')">
                    <small class="form-text">Formatos: JPG, PNG, GIF. Dejar vacío para mantener la foto actual</small>
                </div>
                ${(ins.foto ?? ins.Foto) ? `
                <div class="form-group">
                    <label>Foto actual:</label>
                    <img id="editInstFotoActual" src="${ins.foto ?? ins.Foto}" style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 10px; display: block;">
                </div>
                ` : ''}
                <div class="form-group" id="editInstFotoPreviewContainer" style="display:none;">
                    <label>Nueva foto (vista previa):</label>
                    <img id="editInstFotoPreview" style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 10px; display: block;">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button>
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Actualizar</button>
                </div>
            </form>
        `, () => {
            document.getElementById('formEditarInstructor').addEventListener('submit', actualizarInstructorAPI);
        });

    } catch (error) {
        console.error('❌ Error al cargar instructor para editar:', error);
        showToast('Error al cargar datos: ' + error.message, 'error');
    }
}

async function actualizarInstructorAPI(event) {
    event.preventDefault();
    const btn = event.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

    const datos = {
        id_instructor:     parseInt(document.getElementById('editInstId').value),
        nombre_completo:   document.getElementById('editInstNombre').value.trim(),
        especialidad:      document.getElementById('editInstEspecialidad').value,
        rango:             document.getElementById('editInstRango').value.trim()             || null,
        experiencia_anios: parseInt(document.getElementById('editInstExperiencia').value)    || 0,
        certificaciones:   document.getElementById('editInstCertificaciones').value.trim()   || null,
        email:             document.getElementById('editInstEmail').value.trim()              || null,
        telefono:          document.getElementById('editInstTelefono').value.trim()           || null,
        bio:               document.getElementById('editInstBio').value.trim()                || null,
        foto:              null, // Se enviará null si no hay nueva foto (mantiene la actual en BD)
        estado:            document.getElementById('editInstEstado').value,
        admin_id:          INSTRUCTORES_API.ADMIN_ID
    };

    // Capturar la foto si fue seleccionada una nueva
    const fotoInput = document.getElementById('editInstFoto');
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        try {
            const fotoBase64 = await convertirImagenABase64(fotoInput.files[0]);
            datos.foto = fotoBase64;
        } catch (error) {
            console.error('❌ Error al procesar la foto:', error);
            showToast('Error al procesar la imagen', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Actualizar';
            return;
        }
    }

    try {
        console.log('📤 Actualizando instructor:', datos);
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos)
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        console.log('✅ Instructor actualizado:', resultado);

        if (resultado.status === 'SUCCESS') {
            showToast('Instructor actualizado exitosamente', 'success');
            closeDynModal();
            await cargarInstructoresCompleto();
        } else {
            throw new Error(resultado.mensaje || 'Error al actualizar instructor');
        }
    } catch (error) {
        console.error('❌ Error al actualizar instructor:', error);
        showToast('Error al actualizar: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Actualizar';
    }
}

// ============================================
// 6. ELIMINAR INSTRUCTOR
// ============================================
function eliminarInstructorAPI(idInstructor) {
    // Buscar datos del instructor para mostrarlos en el modal
    const instructor = INSTRUCTORES_STATE.data.find(i => {
        const id = i.id_instructor ?? i.ID_Instructor ?? i.Id_Instructor ?? i.id ?? i.ID;
        return id == idInstructor;
    });

    const nombre      = instructor?.nombre_completo ?? instructor?.Nombre_Completo ?? 'Este instructor';
    const especialidad = instructor?.especialidad   ?? instructor?.Especialidad    ?? '—';
    const rango       = instructor?.rango           ?? instructor?.Rango           ?? '—';

    // Rellenar contenido dinámico del modal
    const msgEl = document.querySelector('#deleteInstructorModal .del-inst-message');
    if (msgEl) {
        const foto = instructor?.foto ?? instructor?.Foto ?? '';
        msgEl.innerHTML = `
            <div style="text-align:center;">
                ${foto
                    ? `<img src="${foto}" alt="${nombre}" style="
                        width:80px;height:80px;border-radius:50%;object-fit:cover;
                        border:3px solid var(--gold);margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;">`
                    : `<div class="del-inst-avatar"><i class="fas fa-chalkboard-teacher"></i></div>`
                }
                <h3 class="del-inst-title">¿Eliminar este instructor?</h3>
                <p class="del-inst-subtitle">Estás a punto de <strong>eliminar permanentemente</strong> al instructor:</p>
                <div class="del-inst-info-card">
                    <p><strong>Nombre:</strong> <span>${nombre}</span></p>
                    <p><strong>Especialidad:</strong> <span>${especialidad}</span></p>
                    <p><strong>Rango:</strong> <span>${rango}</span></p>
                </div>
                <div class="del-inst-warning-box">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Si tiene cursos o eventos asignados, solo se dará de baja. De lo contrario, se eliminará permanentemente.</p>
                </div>
            </div>`;
    }

    // Guardar ID en el modal y abrirlo
    const modal = document.getElementById('deleteInstructorModal');
    if (modal) modal.dataset.instructorId = idInstructor;
    openModal('deleteInstructorModal');
}

async function confirmarEliminarInstructorAPI() {
    const modal = document.getElementById('deleteInstructorModal');
    const idInstructor = modal?.dataset.instructorId;
    if (!idInstructor) return;

    const btn = document.getElementById('btnConfirmDeleteInstructor');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'; }

    try {
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/`, {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id_instructor: parseInt(idInstructor), admin_id: INSTRUCTORES_API.ADMIN_ID })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        console.log('✅ Respuesta eliminación:', resultado);

        if (resultado.status === 'SUCCESS') {
            closeModal('deleteInstructorModal');
            showToast(resultado.mensaje || 'Instructor eliminado exitosamente', 'success');
            await cargarInstructoresCompleto();
        } else {
            throw new Error(resultado.mensaje || 'Error al eliminar instructor');
        }
    } catch (error) {
        console.error('❌ Error al eliminar instructor:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar'; }
    }
}

// ============================================
// 7. FILTROS Y BÚSQUEDA
// ============================================
function initInstructoresFilters() {
    const container = document.getElementById('instructores');
    if (!container) return;

    // ✅ FIX: El HTML usa .filter-search > input, NO .search-box input
    const searchInput = container.querySelector('.filter-search input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                INSTRUCTORES_STATE.filters.busqueda = this.value.trim();
                INSTRUCTORES_STATE.currentPage = 1;
                cargarInstructoresCompleto();
            }, 500);
        });
    }

    // Filtro de especialidad (si lo agregas al HTML con id="filtroEspecialidad")
    const especialidadSelect = container.querySelector('#filtroEspecialidad');
    if (especialidadSelect) {
        especialidadSelect.addEventListener('change', function () {
            INSTRUCTORES_STATE.filters.especialidad = this.value;
            INSTRUCTORES_STATE.currentPage = 1;
            cargarInstructoresCompleto();
        });
    }

    // Filtro de estado (si lo agregas al HTML con id="filtroEstado")
    const estadoSelect = container.querySelector('#filtroEstado');
    if (estadoSelect) {
        estadoSelect.addEventListener('change', function () {
            INSTRUCTORES_STATE.filters.estado = this.value;
            INSTRUCTORES_STATE.currentPage = 1;
            cargarInstructoresCompleto();
        });
    }
}

// ============================================
// 8. PAGINACIÓN
// ============================================
function actualizarPaginacionInstructores() {
    const container = document.getElementById('instructores');
    if (!container) return;

    const total      = INSTRUCTORES_STATE.totalItems;
    const totalPages = Math.ceil(total / INSTRUCTORES_STATE.itemsPerPage);
    const cur        = INSTRUCTORES_STATE.currentPage;
    const pp         = INSTRUCTORES_STATE.itemsPerPage;

    // ✅ FIX: El HTML usa .table-pagination, NO .pagination-wrapper
    const paginationDiv = container.querySelector('.table-pagination');
    if (!paginationDiv) return;

    const infoEl = paginationDiv.querySelector('.pagination-info');
    const ctrlEl = paginationDiv.querySelector('.pagination-controls');

    if (infoEl) {
        const desde = total > 0 ? (cur - 1) * pp + 1 : 0;
        const hasta = Math.min(cur * pp, total);
        infoEl.textContent = `Mostrando ${desde}–${hasta} de ${total.toLocaleString()} instructores`;
    }

    if (!ctrlEl) return;
    if (totalPages <= 1) { ctrlEl.innerHTML = ''; return; }

    let html = `<button class="btn-pagination" ${cur === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    const pages = [];
    if (totalPages <= 7) {
        for (let j = 1; j <= totalPages; j++) pages.push(j);
    } else {
        pages.push(1);
        if (cur > 3) pages.push('...');
        for (let j = Math.max(2, cur - 1); j <= Math.min(totalPages - 1, cur + 1); j++) pages.push(j);
        if (cur < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '...') {
            html += `<button class="btn-pagination" disabled>…</button>`;
        } else {
            html += `<button class="btn-pagination${p === cur ? ' active' : ''}">${p}</button>`;
        }
    });

    html += `<button class="btn-pagination" ${cur === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    ctrlEl.innerHTML = html;

    ctrlEl.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.disabled) return;
            const txt = this.textContent.trim();
            let np = cur;
            if (this.querySelector('.fa-chevron-left'))       np = cur - 1;
            else if (this.querySelector('.fa-chevron-right')) np = cur + 1;
            else np = parseInt(txt);
            if (np >= 1 && np <= totalPages) {
                INSTRUCTORES_STATE.currentPage = np;
                renderInstructoresAPI();
                actualizarPaginacionInstructores();
            }
        });
    });
}

// ============================================
// 9. ASIGNAR INSTRUCTOR A CURSO / EVENTO
// ============================================
async function asignarInstructorACurso(idCurso, idInstructor) {
    try {
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/asignar-curso`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id_curso: idCurso, id_instructor: idInstructor, admin_id: INSTRUCTORES_API.ADMIN_ID })
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        if (resultado.status === 'SUCCESS') { showToast('Instructor asignado al curso', 'success'); return true; }
        throw new Error(resultado.mensaje || 'Error al asignar');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        return false;
    }
}

async function asignarInstructorAEvento(idEvento, idInstructor) {
    try {
        const response = await fetch(`${INSTRUCTORES_API.BASE_URL}/asignar-evento`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id_evento: idEvento, id_instructor: idInstructor, admin_id: INSTRUCTORES_API.ADMIN_ID })
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const resultado = await response.json();
        if (resultado.status === 'SUCCESS') { showToast('Instructor asignado al evento', 'success'); return true; }
        throw new Error(resultado.mensaje || 'Error al asignar');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        return false;
    }
}

// ============================================
// HELPER — Opciones del select de especialidad
// (valores deben coincidir con CHECK CONSTRAINT de la BD)
// ============================================
function _opcionesEspecialidad(seleccionada = '') {
    const especialidades = [
        'Emergencias Médicas',
        'Rescate',
        'Trauma',
        'Soporte Vital',
        'Comunicaciones',
        'Materiales Peligrosos',
        'Búsqueda y Salvamento',
        'Otros'
    ];
    return especialidades
        .map(e => `<option value="${e}" ${e === seleccionada ? 'selected' : ''}>${e}</option>`)
        .join('');
}

// ============================================
// HELPER — Funciones para manejo de imágenes
// ============================================
function previsualizarFoto(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const container = document.getElementById(previewId + 'Container');
    
    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validar tipo de archivo
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            showToast('Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)', 'error');
            input.value = '';
            return;
        }
        
        // Validar tamaño (máximo 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB en bytes
        if (file.size > maxSize) {
            showToast('La imagen no debe superar los 2MB', 'error');
            input.value = '';
            return;
        }
        
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.src = e.target.result;
                if (container) {
                    container.style.display = 'block';
                }
            }
        };
        reader.readAsDataURL(file);
    }
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        // Validar tipo de archivo
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            reject(new Error('Tipo de archivo no permitido'));
            return;
        }
        
        // Validar tamaño (máximo 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            reject(new Error('El archivo es demasiado grande (máx. 2MB)'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// ============================================
// EXPORTAR AL SCOPE GLOBAL
// ============================================
window.cargarInstructoresCompleto      = cargarInstructoresCompleto;
window.showAddInstructorModal          = showAddInstructorModal;
window.mostrarModalNuevoInstructor     = mostrarModalNuevoInstructor;
window.verDetalleInstructorAPI         = verDetalleInstructorAPI;
window.editarInstructorAPI             = editarInstructorAPI;
window.eliminarInstructorAPI           = eliminarInstructorAPI;
window.confirmarEliminarInstructorAPI  = confirmarEliminarInstructorAPI;
window.asignarInstructorACurso         = asignarInstructorACurso;
window.asignarInstructorAEvento        = asignarInstructorAEvento;
window.previsualizarFoto               = previsualizarFoto;
window.convertirImagenABase64          = convertirImagenABase64;

console.log('✅ instructores-api.js cargado — CGPVP Panel Admin');