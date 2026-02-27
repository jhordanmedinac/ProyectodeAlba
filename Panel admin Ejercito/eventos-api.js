// ============================================
// eventos-api.js FINAL CON FILTROS Y PAGINACIÓN
// Sistema completo de gestión de eventos
// ============================================

(function() {
    'use strict';

    const EVENTOS_API_URL = 'https://paramedicosdelperu.org/api/admin/eventos/';

    // ============================================
    // ESTADO DE FILTROS Y PAGINACIÓN
    // ============================================
    let estadoEventos = {
        busqueda: null,
        tipo: null,
        estado: null,
        pagina: 1,
        por_pagina: 10,  // 🔥 10 eventos por página
        total: 0
    };

    // ============================================
    // FUNCIONES DE UTILIDAD
    // ============================================

    function getAdminId() {
        try {
            const adminData = JSON.parse(localStorage.getItem('admin_data'));
            return adminData?.admin_id || null;
        } catch {
            return null;
        }
    }

    function formatearFechaLarga(fecha) {
        if (!fecha) return '';
        try {
            const [year, month, day] = fecha.split('-');
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            return `${parseInt(day)} de ${meses[parseInt(month)-1]} de ${year}`;
        } catch {
            return fecha;
        }
    }

    function normalizarEstado(estado) {
        const map = {
            'Programado': 'programado',
            'En Curso': 'en-curso',
            'Finalizado': 'finalizado',
            'Cancelado': 'cancelado'
        };
        return map[estado] || estado.toLowerCase().replace(' ', '-');
    }

    // ============================================
    // INICIALIZAR FILTROS
    // ============================================
    function inicializarFiltros() {
        console.log('🔧 Inicializando filtros de eventos...');
        
        const seccionEventos = document.getElementById('eventos');
        if (!seccionEventos) {
            console.warn('⚠️ Sección de eventos no encontrada');
            return;
        }

        const inputBusqueda = seccionEventos.querySelector('.filter-search input');
        const selectTipo = seccionEventos.querySelectorAll('.filter-select')[0];
        const selectEstado = seccionEventos.querySelectorAll('.filter-select')[1];

        if (!inputBusqueda || !selectTipo || !selectEstado) {
            console.warn('⚠️ No se encontraron todos los elementos de filtros');
            return;
        }

        inputBusqueda.id = 'filtro-busqueda-eventos';
        selectTipo.id = 'filtro-tipo-eventos';
        selectEstado.id = 'filtro-estado-eventos';

        let timeoutBusqueda = null;

        inputBusqueda.addEventListener('input', (e) => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                estadoEventos.busqueda = e.target.value.trim() || null;
                estadoEventos.pagina = 1;
                window.renderEventos();
            }, 500);
        });

        selectTipo.addEventListener('change', (e) => {
            estadoEventos.tipo = e.target.value || null;
            estadoEventos.pagina = 1;
            window.renderEventos();
        });

        selectEstado.addEventListener('change', (e) => {
            estadoEventos.estado = e.target.value || null;
            estadoEventos.pagina = 1;
            window.renderEventos();
        });

        console.log('✅ Filtros inicializados correctamente');
    }

    // ============================================
    // CONSTRUIR URL CON PARÁMETROS
    // ============================================
    function construirURLConFiltros() {
        const params = new URLSearchParams();
        
        if (estadoEventos.busqueda) params.append('busqueda', estadoEventos.busqueda);
        if (estadoEventos.tipo) params.append('tipo', estadoEventos.tipo);
        if (estadoEventos.estado) params.append('estado', estadoEventos.estado);
        
        params.append('pagina', estadoEventos.pagina);
        params.append('por_pagina', estadoEventos.por_pagina);

        return `${EVENTOS_API_URL}?${params.toString()}`;
    }

    // ============================================
    // RENDERIZAR EVENTOS
    // ============================================
    window.renderEventos = async function() {
        const c = document.getElementById('eventos'); 
        if (!c) return;
        
        const g = c.querySelector('.events-grid'); 
        if (!g) return;

        try {
            const url = construirURLConFiltros();
            console.log('🔄 Cargando eventos desde API:', url);
            
            const response = await fetch(url);
            const result = await response.json();

            if (result.status !== 'SUCCESS') {
                throw new Error(result.mensaje || result.detail || 'Error al cargar eventos');
            }

            const data = result.data || [];
            estadoEventos.total = result.total || 0;

            console.log('✅ Eventos cargados:', data.length, 'de', estadoEventos.total);

            // Mostrar filtros activos
            const filtrosActivos = [];
            if (estadoEventos.busqueda) filtrosActivos.push(`Búsqueda: "${estadoEventos.busqueda}"`);
            if (estadoEventos.tipo) filtrosActivos.push(`Tipo: ${estadoEventos.tipo}`);
            if (estadoEventos.estado) filtrosActivos.push(`Estado: ${estadoEventos.estado}`);
            
            if (filtrosActivos.length > 0) {
                console.log('🔍 Filtros activos:', filtrosActivos.join(' | '));
            }

            if (data.length === 0) {
                const mensajeVacio = filtrosActivos.length > 0 
                    ? 'No se encontraron eventos con los filtros aplicados'
                    : 'No hay eventos registrados';
                
                g.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><p>${mensajeVacio}</p></div>`;
                renderizarPaginacion(0, 0);
                return;
            }

            // Renderizar eventos
            g.innerHTML = data.map(ev => {
                const estadoNorm = normalizarEstado(ev.estado);
                return `
                    <div class="event-card" 
                         data-id="${ev.id}"
                         data-titulo="${(ev.titulo || '').replace(/"/g, '&quot;')}"
                         data-fecha="${formatearFechaLarga(ev.fecha)}"
                         data-ubicacion="${(ev.ubicacion || 'Por definir').replace(/"/g, '&quot;')}">
                        <div class="event-header">
                            <span class="event-type">${ev.tipo}</span>
                            <span class="event-status status-${estadoNorm}">${ev.estado}</span>
                        </div>
                        <h3>${ev.titulo}</h3>
                        <div class="event-details">
                            <div class="event-detail">
                                <i class="fas fa-calendar"></i>
                                <span>${formatearFechaLarga(ev.fecha)}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-clock"></i>
                                <span>${ev.hora_inicio ? ev.hora_inicio.substring(0,5) : '00:00'} - ${ev.hora_fin ? ev.hora_fin.substring(0,5) : '00:00'}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${ev.ubicacion || 'Por definir'}</span>
                            </div>
                            ${ev.instructor_nombre ? `
                            <div class="event-detail">
                                <i class="fas fa-user"></i>
                                <span>Instructor: ${ev.instructor_nombre}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="event-actions">
                            <button class="btn-small btn-primary" onclick="viewEvento(${ev.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <button class="btn-small btn-secondary" onclick="editEvento(${ev.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteEvento(${ev.id})" style="margin-left:auto;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Renderizar paginación
            renderizarPaginacion(data.length, estadoEventos.total);

        } catch (error) {
            console.error('❌ Error al cargar eventos:', error);
            g.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar eventos</p></div>';
            if (typeof showToast === 'function') {
                showToast('Error al cargar eventos: ' + error.message, 'error');
            }
        }
    };

    // ============================================
    // RENDERIZAR PAGINACIÓN
    // ============================================
    function renderizarPaginacion(cantidad, total) {
        const c = document.getElementById('eventos');
        if (!c) return;

        const paginacionDiv = c.querySelector('.table-pagination');
        if (!paginacionDiv) return;

        const paginaActual = estadoEventos.pagina;
        const porPagina = estadoEventos.por_pagina;
        const totalPaginas = Math.ceil(total / porPagina);

        // Actualizar info de paginación
        const infoDiv = paginacionDiv.querySelector('.pagination-info');
        if (infoDiv) {
            const desde = total === 0 ? 0 : ((paginaActual - 1) * porPagina) + 1;
            const hasta = Math.min(paginaActual * porPagina, total);
            
            const filtrosTexto = (estadoEventos.busqueda || estadoEventos.tipo || estadoEventos.estado) 
                ? ' (filtrados)' : '';
            
            infoDiv.textContent = `Mostrando ${desde}-${hasta} de ${total} eventos${filtrosTexto}`;
        }

        // Actualizar controles de paginación
        const controlesDiv = paginacionDiv.querySelector('.pagination-controls');
        if (!controlesDiv) return;

        if (totalPaginas <= 1) {
            controlesDiv.innerHTML = '';
            return;
        }

        // Generar botones de paginación
        let botones = [];

        // Botón anterior
        botones.push(`
            <button class="btn-pagination" onclick="cambiarPaginaEventos(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `);

        // Lógica de páginas a mostrar
        const maxBotones = 5;
        let inicio = Math.max(1, paginaActual - 2);
        let fin = Math.min(totalPaginas, inicio + maxBotones - 1);

        if (fin - inicio < maxBotones - 1) {
            inicio = Math.max(1, fin - maxBotones + 1);
        }

        // Primera página si no está visible
        if (inicio > 1) {
            botones.push(`<button class="btn-pagination" onclick="cambiarPaginaEventos(1)">1</button>`);
            if (inicio > 2) {
                botones.push(`<button class="btn-pagination" disabled>...</button>`);
            }
        }

        // Páginas del rango
        for (let i = inicio; i <= fin; i++) {
            const activo = i === paginaActual ? 'active' : '';
            botones.push(`<button class="btn-pagination ${activo}" onclick="cambiarPaginaEventos(${i})">${i}</button>`);
        }

        // Última página si no está visible
        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) {
                botones.push(`<button class="btn-pagination" disabled>...</button>`);
            }
            botones.push(`<button class="btn-pagination" onclick="cambiarPaginaEventos(${totalPaginas})">${totalPaginas}</button>`);
        }

        // Botón siguiente
        botones.push(`
            <button class="btn-pagination" onclick="cambiarPaginaEventos(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `);

        controlesDiv.innerHTML = botones.join('');
    }

    // ============================================
    // CAMBIAR PÁGINA
    // ============================================
    window.cambiarPaginaEventos = function(nuevaPagina) {
        const totalPaginas = Math.ceil(estadoEventos.total / estadoEventos.por_pagina);
        
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
        
        estadoEventos.pagina = nuevaPagina;
        window.renderEventos();
        
        // Scroll suave hacia arriba
        const seccionEventos = document.getElementById('eventos');
        if (seccionEventos) {
            seccionEventos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // ============================================
    // LIMPIAR FILTROS
    // ============================================
    window.limpiarFiltrosEventos = function() {
        estadoEventos = {
            busqueda: null,
            tipo: null,
            estado: null,
            pagina: 1,
            por_pagina: 10,
            total: 0
        };

        const inputBusqueda = document.getElementById('filtro-busqueda-eventos');
        const selectTipo = document.getElementById('filtro-tipo-eventos');
        const selectEstado = document.getElementById('filtro-estado-eventos');

        if (inputBusqueda) inputBusqueda.value = '';
        if (selectTipo) selectTipo.value = '';
        if (selectEstado) selectEstado.value = '';

        window.renderEventos();
    };

    // ============================================
    // VER DETALLE DE EVENTO
    // ============================================
    window.viewEvento = async function(id) {
        try {
            console.log('🔍 Cargando detalles del evento:', id);
            const response = await fetch(`${EVENTOS_API_URL}${id}`);
            const result = await response.json();

            if (result.status !== 'SUCCESS') {
                throw new Error('Evento no encontrado');
            }

            const ev = result.data;
            const estadoNorm = normalizarEstado(ev.estado);

            const html = `
                <div style="text-align:center;margin-bottom:20px;">
                    <h3 style="color:var(--navy);">${ev.titulo}</h3>
                    <span class="badge" style="background:var(--gold);color:white;font-size:14px;padding:8px 16px;margin-top:10px;">
                        ${ev.tipo}
                    </span>
                </div>
                <div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:15px;">
                    <p>${ev.descripcion || 'Sin descripción'}</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                    <div><b>Fecha:</b> ${formatearFechaLarga(ev.fecha)}</div>
                    <div><b>Horario:</b> ${ev.hora_inicio ? ev.hora_inicio.substring(0,5) : '00:00'} - ${ev.hora_fin ? ev.hora_fin.substring(0,5) : '00:00'}</div>
                    <div><b>Ubicación:</b> ${ev.ubicacion || 'Por definir'}</div>
                    <div><b>Instructor:</b> ${ev.instructor_nombre || 'Sin asignar'}</div>
                    <div><b>Estado:</b> <span class="event-status status-${estadoNorm}">${ev.estado}</span></div>
                </div>
            `;
            
            if (typeof showDynModal === 'function') {
                showDynModal('Detalles del Evento', html);
            }
        } catch (error) {
            console.error('❌ Error al ver evento:', error);
            if (typeof showToast === 'function') {
                showToast('Error al cargar detalles del evento', 'error');
            }
        }
    };

    // ============================================
    // EDITAR EVENTO
    // ============================================
    window.editEvento = async function(id) {
        try {
            console.log('📝 Cargando evento para editar:', id);
            const response = await fetch(`${EVENTOS_API_URL}${id}`);
            const result = await response.json();

            if (result.status !== 'SUCCESS') {
                throw new Error('Evento no encontrado');
            }

            const ev = result.data;
            await mostrarFormularioEvento(true, ev);

        } catch (error) {
            console.error('❌ Error al cargar evento para editar:', error);
            if (typeof showToast === 'function') {
                showToast('Error al cargar evento', 'error');
            }
        }
    };

    // ============================================
    // CREAR NUEVO EVENTO
    // ============================================
    window.nuevoEvento = async function() {
        await mostrarFormularioEvento(false);
    };

    // ============================================
    // ELIMINAR EVENTO
    // ============================================
    window.deleteEvento = function(id) {
        const adminId = getAdminId();
        if (!adminId) {
            if (typeof showToast === 'function') showToast('Error: No se pudo obtener el ID del administrador', 'error');
            return;
        }

        // Leer datos desde data-attributes de la card
        const card    = document.querySelector(`.event-card[data-id="${id}"]`);
        const titulo  = card?.dataset.titulo   || `Evento #${id}`;
        const fecha   = card?.dataset.fecha    || '—';
        const lugar   = card?.dataset.ubicacion || '—';

        const msgEl = document.querySelector('#deleteEventoModal .del-evento-message');
        if (msgEl) {
            msgEl.innerHTML = `
                <div style="text-align:center;">
                    <div class="del-evento-avatar"><i class="fas fa-calendar-alt"></i></div>
                    <h3 class="del-evento-title">¿Eliminar este evento?</h3>
                    <p class="del-evento-subtitle">Estás a punto de <strong>eliminar permanentemente</strong> el evento:</p>
                    <div class="del-evento-info-card">
                        <p><strong>Nombre:</strong> <span>${titulo}</span></p>
                        <p><strong>Fecha:</strong> <span>${fecha}</span></p>
                        <p><strong>Lugar:</strong> <span>${lugar}</span></p>
                    </div>
                    <div class="del-evento-warning-box">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Esta acción NO SE PUEDE DESHACER. Se eliminarán todos los datos del evento.</p>
                    </div>
                </div>`;
        }

        const modal = document.getElementById('deleteEventoModal');
        if (modal) { modal.dataset.eventoId = id; modal.dataset.adminId = adminId; }
        openModal('deleteEventoModal');
    };

    window.confirmarEliminarEvento = async function() {
        const modal   = document.getElementById('deleteEventoModal');
        const id      = modal?.dataset.eventoId;
        const adminId = modal?.dataset.adminId;
        if (!id) return;

        const btn = document.getElementById('btnConfirmDeleteEvento');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'; }

        try {
            const response = await fetch(`${EVENTOS_API_URL}${id}?admin_id=${adminId}`, { method: 'DELETE' });
            const result   = await response.json();

            if (result.status === 'SUCCESS') {
                if (typeof window.closeModal === 'function') window.closeModal('deleteEventoModal');
                if (typeof showToast   === 'function') showToast('Evento eliminado correctamente', 'success');
                window.renderEventos();
            } else {
                throw new Error(result.mensaje || 'Error al eliminar evento');
            }
        } catch (error) {
            console.error('❌ Error al eliminar evento:', error);
            if (typeof showToast === 'function') showToast('Error al eliminar evento: ' + error.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar'; }
        }
    };

    // ============================================
    // MOSTRAR FORMULARIO (Modal)
    // ============================================
    async function mostrarFormularioEvento(esEditar = false, ev = null) {
        const instructoresHTML = await cargarInstructoresSelect();

        const html = `
            <form id="formEvento" style="max-width:600px;margin:0 auto;">
                ${esEditar ? `<input type="hidden" id="eventoId" value="${ev.id}">` : ''}
                
                <div class="form-group">
                    <label>Título *</label>
                    <input type="text" id="eventoTitulo" required value="${esEditar ? ev.titulo : ''}" placeholder="Ej: Taller de Defensa Personal">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo *</label>
                        <select id="eventoTipo" required>
                            <option value="Capacitacion" ${esEditar && ev.tipo === 'Capacitacion' ? 'selected' : ''}>Capacitacion</option>
                            <option value="Taller" ${esEditar && ev.tipo === 'Taller' ? 'selected' : ''}>Taller</option>
                            <option value="Simulacro" ${esEditar && ev.tipo === 'Simulacro' ? 'selected' : ''}>Simulacro</option>
                            <option value="Conferencia" ${esEditar && ev.tipo === 'Conferencia' ? 'selected' : ''}>Conferencia</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Estado *</label>
                        <select id="eventoEstado" required>
                            <option value="Programado" ${esEditar && ev.estado === 'Programado' ? 'selected' : ''}>Programado</option>
                            <option value="En Curso" ${esEditar && ev.estado === 'En Curso' ? 'selected' : ''}>En Curso</option>
                            <option value="Finalizado" ${esEditar && ev.estado === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                            <option value="Cancelado" ${esEditar && ev.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="eventoDescripcion" rows="3" placeholder="Descripción del evento">${esEditar ? (ev.descripcion || '') : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" id="eventoFecha" required value="${esEditar ? ev.fecha : ''}">
                    </div>

                    <div class="form-group">
                        <label>Hora Inicio</label>
                        <input type="time" id="eventoHoraInicio" value="${esEditar ? (ev.hora_inicio ? ev.hora_inicio.substring(0,5) : '') : ''}">
                    </div>

                    <div class="form-group">
                        <label>Hora Fin</label>
                        <input type="time" id="eventoHoraFin" value="${esEditar ? (ev.hora_fin ? ev.hora_fin.substring(0,5) : '') : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Ubicación</label>
                    <input type="text" id="eventoUbicacion" value="${esEditar ? (ev.ubicacion || '') : ''}" placeholder="Ej: Sede Lima Centro">
                </div>

                <div class="form-group">
                    <label>Instructor</label>
                    <select id="eventoInstructor">
                        <option value="">Sin asignar</option>
                        ${instructoresHTML}
                    </select>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> ${esEditar ? 'Actualizar' : 'Crear'} Evento
                    </button>
                </div>
            </form>
        `;

        if (typeof showDynModal === 'function') {
            showDynModal(esEditar ? 'Editar Evento' : 'Nuevo Evento', html, () => {
                if (esEditar && ev.id_instructor) {
                    const selectInstructor = document.getElementById('eventoInstructor');
                    if (selectInstructor) {
                        selectInstructor.value = ev.id_instructor;
                    }
                }

                const form = document.getElementById('formEvento');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const adminId = getAdminId();
                        if (!adminId) {
                            if (typeof showToast === 'function') {
                                showToast('Error: No se pudo obtener el ID del administrador', 'error');
                            }
                            return;
                        }

                        const datos = {
                            titulo: document.getElementById('eventoTitulo').value.trim(),
                            tipo: document.getElementById('eventoTipo').value,
                            descripcion: document.getElementById('eventoDescripcion').value.trim() || null,
                            fecha: document.getElementById('eventoFecha').value,
                            hora_inicio: document.getElementById('eventoHoraInicio').value || null,
                            hora_fin: document.getElementById('eventoHoraFin').value || null,
                            ubicacion: document.getElementById('eventoUbicacion').value.trim() || null,
                            id_instructor: document.getElementById('eventoInstructor').value ? parseInt(document.getElementById('eventoInstructor').value) : null,
                            estado: document.getElementById('eventoEstado').value,
                            admin_id: adminId
                        };

                        if (esEditar) {
                            datos.id_evento = parseInt(document.getElementById('eventoId').value);
                            await actualizarEvento(datos);
                        } else {
                            await crearEvento(datos);
                        }
                    });
                }
            });
        }
    }

    // ============================================
    // CREAR EVENTO
    // ============================================
    async function crearEvento(datos) {
        try {
            console.log('➕ Creando evento:', datos);
            const response = await fetch(EVENTOS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const result = await response.json();

            if (result.status === 'SUCCESS') {
                if (typeof showToast === 'function') {
                    showToast('Evento creado correctamente', 'success');
                }
                if (typeof closeDynModal === 'function') {
                    closeDynModal();
                }
                window.renderEventos();
            } else {
                throw new Error(result.mensaje || 'Error al crear evento');
            }
        } catch (error) {
            console.error('❌ Error al crear evento:', error);
            if (typeof showToast === 'function') {
                showToast('Error al crear evento: ' + error.message, 'error');
            }
        }
    }

    // ============================================
    // ACTUALIZAR EVENTO
    // ============================================
    async function actualizarEvento(datos) {
        try {
            console.log('💾 Actualizando evento:', datos);
            
            const response = await fetch(`${EVENTOS_API_URL}${datos.id_evento}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const result = await response.json();

            if (result.status === 'SUCCESS') {
                if (typeof showToast === 'function') {
                    showToast('Evento actualizado correctamente', 'success');
                }
                if (typeof closeDynModal === 'function') {
                    closeDynModal();
                }
                window.renderEventos();
            } else {
                throw new Error(result.mensaje || 'Error al actualizar evento');
            }
        } catch (error) {
            console.error('❌ Error al actualizar evento:', error);
            if (typeof showToast === 'function') {
                showToast('Error al actualizar evento: ' + error.message, 'error');
            }
        }
    }

    // ============================================
    // CARGAR INSTRUCTORES PARA SELECT
    // ============================================
    async function cargarInstructoresSelect() {
        try {
            console.log('📚 Cargando instructores desde API...');
            const response = await fetch('hhttps://paramedicosdelperu.org/api/admin/instructores/?estado=Activo');
            
            const result = await response.json();
            
            if (result.status === 'SUCCESS' && result.data) {
                console.log('✅ Instructores cargados:', result.data.length);
                return result.data.map(inst => 
                    `<option value="${inst.id}">${inst.nombre_completo}</option>`
                ).join('');
            }
            return '';
        } catch (error) {
            console.error('❌ Error al cargar instructores:', error);
            return '';
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ eventos-api.js cargado correctamente');
        
        const seccionEventos = document.getElementById('eventos');
        if (seccionEventos && seccionEventos.classList.contains('active')) {
            inicializarFiltros();
            window.renderEventos();
        }
    });

    // Observer para detectar cuando se muestra la sección de eventos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const seccionEventos = document.getElementById('eventos');
                if (seccionEventos && seccionEventos.classList.contains('active')) {
                    inicializarFiltros();
                    window.renderEventos();
                }
            }
        });
    });

    setTimeout(() => {
        const seccionEventos = document.getElementById('eventos');
        if (seccionEventos) {
            observer.observe(seccionEventos, { attributes: true });
        }
    }, 1000);

})();

// ============================================
// ALIAS PARA COMPATIBILIDAD CON HTML
// ============================================
window.showAddEventModal = window.nuevoEvento;