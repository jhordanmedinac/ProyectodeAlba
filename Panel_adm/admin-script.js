(function verificarAutenticacion() {
    // Verificar si existe sesión activa
    const adminData = localStorage.getItem('admin_data');
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminData || !adminToken) {
        // No hay sesión activa, redirigir al login
        console.warn('No hay sesión activa. Redirigiendo al login...');
        window.location.href = 'index.html';
        return;
    }
    
    // Opcional: Verificar que los datos sean válidos
    try {
        const data = JSON.parse(adminData);
        if (!data.admin_id) {
            throw new Error('Datos de sesión inválidos');
        }
        console.log(' Sesión válida para admin ID:', data.admin_id);
    } catch (error) {
        console.error(' Error en datos de sesión:', error);
        localStorage.clear();
        window.location.href = 'index.html';
    }
})();
const DB = {
    get(key) { try { return JSON.parse(localStorage.getItem('cgpvp_' + key)) || []; } catch { return []; } },
    set(key, data) { localStorage.setItem('cgpvp_' + key, JSON.stringify(data)); },
    nextId(key) { const items = this.get(key); return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1; }
};

function initDatabase() {
    if (DB.get('usuarios').length === 0) {
        DB.set('usuarios', [
            { id:1, nombre:'Juan', apellido:'Pérez', dni:'72345678', email:'juan.perez@email.com', telefono:'987654321', direccion:'Av. Lima 123', departamento:'lima', distrito:'Miraflores', genero:'masculino', fechaNacimiento:'1998-05-15', nivelEducativo:'universitario', profesion:'Ingeniero', motivacion:'Quiero ayudar', experiencia:false, rol:'aspirante', nivel:'', estado:'activo', fechaIngreso:'2025-01-15' },
            { id:2, nombre:'María', apellido:'García', dni:'71234567', email:'maria.garcia@email.com', telefono:'912345678', direccion:'Jr. Cusco 456', departamento:'lima', distrito:'San Isidro', genero:'femenino', fechaNacimiento:'1995-03-20', nivelEducativo:'postgrado', profesion:'Médico', motivacion:'Vocación de servicio', experiencia:true, rol:'alumno', nivel:'bired', estado:'activo', fechaIngreso:'2022-03-10' },
            { id:3, nombre:'Carlos', apellido:'Rodríguez', dni:'70987654', email:'carlos.rodriguez@email.com', telefono:'923456789', direccion:'Calle Arequipa 789', departamento:'arequipa', distrito:'Cayma', genero:'masculino', fechaNacimiento:'1990-08-05', nivelEducativo:'universitario', profesion:'Bombero', motivacion:'Experiencia en emergencias', experiencia:true, rol:'alumno', nivel:'emgra', estado:'activo', fechaIngreso:'2021-08-05' },
            { id:4, nombre:'Ana', apellido:'López', dni:'73456789', email:'ana.lopez@email.com', telefono:'934567890', direccion:'Av. Ejército 321', departamento:'cusco', distrito:'Wanchaq', genero:'femenino', fechaNacimiento:'1992-02-20', nivelEducativo:'tecnico', profesion:'Técnico en Emergencias', motivacion:'Salvar vidas', experiencia:true, rol:'rescatista', nivel:'', estado:'activo', fechaIngreso:'2019-02-20' },
            { id:5, nombre:'Roberto', apellido:'Sánchez', dni:'72567890', email:'roberto.sanchez@email.com', telefono:'945678901', direccion:'Jr. Puno 654', departamento:'lima', distrito:'Breña', genero:'masculino', fechaNacimiento:'2000-12-08', nivelEducativo:'secundaria', profesion:'Estudiante', motivacion:'Aprender primeros auxilios', experiencia:false, rol:'aspirante', nivel:'', estado:'suspendido', fechaIngreso:'2024-12-08' }
        ]);
    }
    
    // ⚠️ MODIFICADO: Ya NO se inicializan instructores en localStorage
    // Los instructores ahora se manejan 100% desde la API
    // if (DB.get('instructores').length === 0) { ... }
    
    if (DB.get('cursos').length === 0) {
        DB.set('cursos', [
            { id:1, titulo:'Primeros Auxilios Básicos', duracion:'40 horas', modalidad:'presencial', instructor:'Dr. Ricardo Torres Vega', descripcion:'Curso fundamental de primeros auxilios.', estado:'activo', fechaInicio:'2025-03-01', fechaFin:'2025-04-01', direccion:'Sede Lima Centro - Av. Arequipa 1234', enlace:'', imagen:'' },
            { id:2, titulo:'Soporte Vital Avanzado (ACLS)', duracion:'60 horas', modalidad:'presencial', instructor:'Dra. Carmen Flores', descripcion:'Curso avanzado de soporte vital.', estado:'activo', fechaInicio:'2025-03-15', fechaFin:'2025-05-15', direccion:'Hospital Central - Jr. Cusco 789', enlace:'', imagen:'' },
            { id:3, titulo:'Rescate en Estructuras Colapsadas (BREC)', duracion:'80 horas', modalidad:'presencial', instructor:'Cmte. Luis Ramírez', descripcion:'Técnicas de búsqueda y rescate.', estado:'activo', fechaInicio:'2025-04-01', fechaFin:'2025-06-01', direccion:'Campo de Entrenamiento - Km 25 Panamericana Sur', enlace:'', imagen:'' },
            { id:4, titulo:'Comunicaciones de Emergencia', duracion:'30 horas', modalidad:'virtual', instructor:'Tte. Fernando Vega', descripcion:'Manejo de equipos de radio y protocolos.', estado:'activo', fechaInicio:'2025-03-10', fechaFin:'2025-04-10', direccion:'', enlace:'https://zoom.us/j/123456789', imagen:'' },
            { id:5, titulo:'RCP y DEA Online', duracion:'20 horas', modalidad:'virtual', instructor:'Dr. Miguel Sánchez', descripcion:'Reanimación cardiopulmonar y uso de desfibrilador.', estado:'activo', fechaInicio:'2025-03-20', fechaFin:'2025-04-05', direccion:'', enlace:'https://meet.google.com/abc-defg-hij', imagen:'' }
        ]);
    }
    // ⚠️ DESACTIVADO: Los eventos ahora se manejan desde la API (eventos-api.js)
    // if (DB.get('eventos').length === 0) {
    //     DB.set('eventos', [
    //         { id:1, titulo:'Primeros Auxilios Avanzados', tipo:'capacitacion', descripcion:'Capacitación intensiva.', fecha:'2025-02-15', horaInicio:'09:00', horaFin:'17:00', ubicacion:'Sede Lima Centro', instructor:'Dr. González', estado:'programado' },
    //         { id:2, titulo:'Simulacro de Rescate en Montaña', tipo:'simulacro', descripcion:'Ejercicio práctico de rescate en montaña.', fecha:'2025-02-05', horaInicio:'08:00', horaFin:'16:00', ubicacion:'Zona Montañosa - Huarochirí', instructor:'Cmte. Ramírez', estado:'en-curso' },
    //         { id:3, titulo:'Manejo de Equipos de Comunicación', tipo:'taller', descripcion:'Taller práctico de comunicaciones.', fecha:'2025-02-20', horaInicio:'14:00', horaFin:'18:00', ubicacion:'Sede Callao', instructor:'Tte. Vega', estado:'programado' }
    //     ]);
    // }
    // ⚠️ DESACTIVADO: Las noticias ahora se manejan desde la API (noticias-api.js)
    // if (DB.get('noticias').length === 0) {
    //     DB.set('noticias', [
    //         { id:1, descripcion:'El CGPVP participó activamente en el Gran Simulacro Nacional, demostrando su capacidad de respuesta ante emergencias y coordinación con otras instituciones.', fecha:'2025-01-15', imagen:'', url:'', destacada:true },
    //         { id:2, descripcion:'Más de 150 voluntarios participaron en el curso intensivo de primeros auxilios avanzados.', fecha:'2025-01-10', imagen:'', url:'', destacada:false },
    //         { id:3, descripcion:'El CGPVP inauguró su nueva sede en Arequipa, expandiendo su presencia a nivel nacional.', fecha:'2025-01-05', imagen:'', url:'', destacada:false }
    //     ]);
    // }
}

// ============================================
// 2. INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
    initNavigation();
    initSidebar();
    // initCharts(); // ❌ COMENTADO - Ahora dashboard-api.js maneja todos los gráficos
    initModals();
    hideLoadingScreen();
    // renderUsuarios(); // ← manejado por gestionusuarios-api.js (carga desde la API)
    // renderInstructores(); // ⚠️ DESACTIVADO - Ahora lo maneja instructores-api.js
    // renderCursos(); // ⚠️ DESACTIVADO - Ahora lo maneja cursos-api.js
    // renderEventos(); // ⚠️ DESACTIVADO - Ahora lo maneja eventos-api.js
    // renderNoticias(); // ⚠️ DESACTIVADO - Ahora lo maneja noticias-api.js
    // updateDashboardKPIs(); // ❌ COMENTADO - Ahora lo maneja dashboard-api.js
    initAllFilters();
});

function hideLoadingScreen() {
    const ls = document.getElementById('loadingScreen');
    setTimeout(() => { ls.classList.add('fade-out'); setTimeout(() => { ls.style.display = 'none'; }, 500); }, 2000);
}

// ============================================
// 3. NAV & SIDEBAR (sin cambios)
// ============================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.querySelector('.page-title');
    const sidebar = document.querySelector('.admin-sidebar');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            const sid = this.getAttribute('data-section');
            const target = document.getElementById(sid);
            if (target) { 
                target.classList.add('active'); 
                pageTitle.textContent = this.querySelector('span').textContent; 
                
                // 🔥 RENDERIZAR DATOS AL CAMBIAR DE SECCIÓN
                if (sid === 'cursos') {
                    // Llamar a la función de cursos-api.js
                    if (typeof cargarCursosDesdeAPI === 'function') {
                        cargarCursosDesdeAPI();
                    }
                }
                else if (sid === 'eventos') {
                    // Llamar a la función de eventos-api.js
                    if (typeof renderEventos === 'function') {
                        renderEventos();
                    }
                }
                // ⚠️ NOTICIAS: noticias-api.js se encarga automáticamente con MutationObserver
            }
            // Cerrar sidebar en móvil después de cambiar de sección
            if (window.innerWidth <= 991 && sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });
}

function initSidebar() {
    const sb = document.querySelector('.admin-sidebar');
    const mm = document.getElementById('menuMobile');
    const st = document.getElementById('sidebarToggle');
    
    // Toggle menú móvil
    if (mm) {
        mm.addEventListener('click', (e) => {
            e.stopPropagation();
            sb.classList.toggle('show');
        });
    }
    
    // Toggle colapsar sidebar en desktop
    if (st) {
        st.addEventListener('click', () => {
            sb.classList.toggle('collapsed');
        });
    }
    
    // Cerrar sidebar al hacer clic fuera en móvil
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 991 && 
            sb.classList.contains('show') &&
            !sb.contains(e.target) && 
            mm && !mm.contains(e.target)) {
            sb.classList.remove('show');
        }
    });
    
    // Cerrar sidebar al cambiar de sección en móvil
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 991) {
                sb.classList.remove('show');
            }
        });
    });
    
    // Manejar resize de ventana
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 991) {
                sb.classList.remove('show');
            }
        }, 250);
    });
}

// ============================================
// 4. DASHBOARD KPIs & CHARTS (sin cambios)
// ============================================
function updateDashboardKPIs() {
    const u = DB.get('usuarios');
    const vals = document.querySelectorAll('.kpi-value');
    const subs = document.querySelectorAll('.kpi-subtitle');
    const bired = u.filter(x => x.rol === 'alumno' && x.nivel === 'bired').length;
    const emgra = u.filter(x => x.rol === 'alumno' && x.nivel === 'emgra').length;
    if (vals[0]) vals[0].textContent = u.length.toLocaleString();
    if (vals[1]) vals[1].textContent = u.filter(x => x.rol === 'aspirante').length.toLocaleString();
    if (vals[2]) vals[2].textContent = (bired + emgra).toLocaleString();
    if (subs[1]) subs[1].textContent = 'BIRED: ' + bired + ' | EMGRA: ' + emgra;
    if (vals[3]) vals[3].textContent = u.filter(x => x.rol === 'rescatista').length.toLocaleString();
}

let chartInstances = {};
function initCharts() {
    const u = DB.get('usuarios');
    Object.values(chartInstances).forEach(c => c.destroy && c.destroy());
    chartInstances = {};

    const asp = u.filter(x => x.rol === 'aspirante').length;
    const bir = u.filter(x => x.rol === 'alumno' && x.nivel === 'bired').length;
    const emg = u.filter(x => x.rol === 'alumno' && x.nivel === 'emgra').length;
    const res = u.filter(x => x.rol === 'rescatista').length;

    const r = document.getElementById('rolesChart');
    if (r) chartInstances.roles = new Chart(r, { type:'bar', data:{ labels:['Aspirantes','Alumnos BIRED','Alumnos EMGRA','Rescatistas'], datasets:[{label:'Cantidad',data:[asp,bir,emg,res],backgroundColor:['#FDB750','#5670BC','#2E3A7C','#000033'],borderRadius:6}] }, options:{ responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f0f0'}},x:{grid:{display:false}}} } });

    const act = u.filter(x => x.estado === 'activo').length;
    const sus = u.filter(x => x.estado === 'suspendido').length;
    const baj = u.filter(x => x.estado === 'baja').length;
    const s = document.getElementById('statusChart');
    if (s) chartInstances.status = new Chart(s, { type:'doughnut', data:{ labels:['Activos','Suspendidos','Baja'], datasets:[{data:[act,sus,baj],backgroundColor:['#43e97b','#FDB750','#e74c3c']}] }, options:{ responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:15,usePointStyle:true}}},cutout:'65%' } });

    const pm = {}; u.forEach(x => { const p = x.profesion || 'Sin Profesión'; pm[p] = (pm[p]||0)+1; });
    const pl = Object.keys(pm).sort((a,b) => pm[b]-pm[a]);
    const pc = document.getElementById('professionChart');
    if (pc) chartInstances.prof = new Chart(pc, { type:'bar', data:{ labels:pl, datasets:[{label:'Cant.',data:pl.map(k=>pm[k]),backgroundColor:'#000033',borderRadius:4}] }, options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{display:false},ticks:{font:{size:11}}}} } });

    function calcAge(d) { if(!d)return 0; const t=new Date(),b=new Date(d); let a=t.getFullYear()-b.getFullYear(); if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--; return a; }
    const ar = {'18-20':0,'21-25':0,'26-30':0,'31-35':0,'36-40':0,'41-45':0,'46-50':0,'51-55':0,'56-60':0,'60+':0};
    u.forEach(x => { const a=calcAge(x.fechaNacimiento); if(a<=20)ar['18-20']++;else if(a<=25)ar['21-25']++;else if(a<=30)ar['26-30']++;else if(a<=35)ar['31-35']++;else if(a<=40)ar['36-40']++;else if(a<=45)ar['41-45']++;else if(a<=50)ar['46-50']++;else if(a<=55)ar['51-55']++;else if(a<=60)ar['56-60']++;else ar['60+']++; });
    const ac = document.getElementById('ageChart');
    if (ac) chartInstances.age = new Chart(ac, { type:'line', data:{ labels:Object.keys(ar), datasets:[{label:'Miembros',data:Object.values(ar),borderColor:'#000033',backgroundColor:'rgba(0,0,51,0.1)',fill:true,tension:0.4}] }, options:{ responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f0f0'}},x:{grid:{display:false}}} } });

    const dm = {}; u.forEach(x => { const d = x.departamento || 'Sin Registro'; dm[d] = (dm[d]||0)+1; });
    const dl = Object.keys(dm).sort((a,b) => dm[b]-dm[a]).slice(0,8);
    const dc = document.getElementById('depChart');
    if (dc) chartInstances.dep = new Chart(dc, { type:'bar', data:{ labels:dl, datasets:[{label:'Miembros',data:dl.map(k=>dm[k]),backgroundColor:'#5670BC',borderRadius:4}] }, options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{display:false},ticks:{font:{size:11}}}} } });
}
const USR_PP = 10; let CURRENT_PAGE = 1; let FILTERED_USUARIOS = [];

function initAllFilters() {
    initUserFilters();
}

function initUserFilters() {
    const userSec = document.getElementById('usuarios');
    if (!userSec) return;
    const searchInput = userSec.querySelector('.search-box input');
    const rolSel = userSec.querySelector('.filter-role');
    const estSel = userSec.querySelector('.filter-status');
    if (searchInput) searchInput.addEventListener('input', applyUserFilters);
    if (rolSel) rolSel.addEventListener('change', applyUserFilters);
    if (estSel) estSel.addEventListener('change', applyUserFilters);
}

function applyUserFilters() {
    const userSec = document.getElementById('usuarios');
    if (!userSec) return;
    const search = (userSec.querySelector('.search-box input')?.value || '').toLowerCase();
    const rol = userSec.querySelector('.filter-role')?.value || '';
    const estado = userSec.querySelector('.filter-status')?.value || '';
    let data = DB.get('usuarios');
    if (search) data = data.filter(x => (x.nombre + ' ' + x.apellido).toLowerCase().includes(search) || x.dni.includes(search) || x.email.toLowerCase().includes(search));
    if (rol) data = data.filter(x => x.rol === rol);
    if (estado) data = data.filter(x => x.estado === estado);
    FILTERED_USUARIOS = data;
    CURRENT_PAGE = 1;
    renderUsuarios();
}

function renderUsuarios() {
    const sec = document.getElementById('usuarios');
    if (!sec) return;
    const data = FILTERED_USUARIOS.length > 0 ? FILTERED_USUARIOS : DB.get('usuarios');
    const tbody = sec.querySelector('tbody');
    if (!tbody) return;
    const start = (CURRENT_PAGE - 1) * USR_PP;
    const end = start + USR_PP;
    const page = data.slice(start, end);
    tbody.innerHTML = page.map(u => {
        const nivel = u.rol === 'alumno' ? (u.nivel === 'bired' ? 'BIRED' : u.nivel === 'emgra' ? 'EMGRA' : '-') : '-';
        return '<tr><td>' + u.id + '</td><td>' + u.nombre + ' ' + u.apellido + '</td><td>' + u.dni + '</td><td>' + u.email + '</td><td>' + u.telefono + '</td><td><span class="badge-rol rol-' + u.rol + '">' + u.rol + '</span></td><td>' + nivel + '</td><td><span class="badge-status status-' + u.estado + '">' + u.estado + '</span></td><td class="actions"><button class="btn-icon btn-view" onclick="viewUser(' + u.id + ')" title="Ver"><i class="fas fa-eye"></i></button><button class="btn-icon btn-edit" onclick="editUser(' + u.id + ')" title="Editar"><i class="fas fa-edit"></i></button><button class="btn-icon btn-delete" onclick="deleteUsuario(' + u.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button></td></tr>';
    }).join('');
    const totalPages = Math.ceil(data.length / USR_PP);
    renderPag('#usuarios .pagination-wrapper', data.length, totalPages, CURRENT_PAGE, (newP) => { CURRENT_PAGE = newP; renderUsuarios(); });
}

function viewUser(id) {
    const u = DB.get('usuarios').find(x => x.id === id);
    if (!u) return;
    const nivel = u.rol === 'alumno' ? (u.nivel === 'bired' ? 'BIRED' : u.nivel === 'emgra' ? 'EMGRA' : 'N/A') : 'N/A';
    showDynModal('Detalles del Usuario', '<div class="user-detail-grid"><div class="detail-item"><label>ID:</label><span>' + u.id + '</span></div><div class="detail-item"><label>Nombre Completo:</label><span>' + u.nombre + ' ' + u.apellido + '</span></div><div class="detail-item"><label>DNI:</label><span>' + u.dni + '</span></div><div class="detail-item"><label>Email:</label><span>' + u.email + '</span></div><div class="detail-item"><label>Teléfono:</label><span>' + u.telefono + '</span></div><div class="detail-item"><label>Dirección:</label><span>' + (u.direccion || 'N/A') + '</span></div><div class="detail-item"><label>Departamento:</label><span>' + u.departamento + '</span></div><div class="detail-item"><label>Distrito:</label><span>' + (u.distrito || 'N/A') + '</span></div><div class="detail-item"><label>Género:</label><span>' + u.genero + '</span></div><div class="detail-item"><label>Fecha Nac.:</label><span>' + fmtShort(u.fechaNacimiento) + '</span></div><div class="detail-item"><label>Nivel Educativo:</label><span>' + (u.nivelEducativo || 'N/A') + '</span></div><div class="detail-item"><label>Profesión:</label><span>' + (u.profesion || 'N/A') + '</span></div><div class="detail-item"><label>Motivación:</label><span>' + (u.motivacion || 'N/A') + '</span></div><div class="detail-item"><label>Experiencia:</label><span>' + (u.experiencia ? 'Sí' : 'No') + '</span></div><div class="detail-item"><label>Rol:</label><span class="badge-rol rol-' + u.rol + '">' + u.rol + '</span></div><div class="detail-item"><label>Nivel:</label><span>' + nivel + '</span></div><div class="detail-item"><label>Estado:</label><span class="badge-status status-' + u.estado + '">' + u.estado + '</span></div><div class="detail-item"><label>Fecha Ingreso:</label><span>' + fmtShort(u.fechaIngreso) + '</span></div></div>');
}

function editUser(id) {
    const u = DB.get('usuarios').find(x => x.id === id);
    if (!u) return;
    const m = document.getElementById('changeStatusModal');
    if (!m) return;
    document.getElementById('statusUserId').value = u.id;
    document.getElementById('statusUserName').textContent = u.nombre + ' ' + u.apellido;
    const roleS = document.getElementById('nuevoRol');
    const levelS = document.getElementById('nivelAlumno');
    const levelF = document.getElementById('nivelField');
    if (roleS) { roleS.value = u.rol; toggleNivelField(); }
    if (levelS && u.rol === 'alumno') levelS.value = u.nivel || '';
    const sels = m.querySelectorAll('select');
    sels.forEach(s => { if (s.id !== 'nuevoRol' && s.id !== 'nivelAlumno') s.value = u.estado; });
    const form = m.querySelector('.modal-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        const all = DB.get('usuarios'), idx = all.findIndex(x => x.id === id);
        if (idx >= 0) {
            all[idx].rol = document.getElementById('nuevoRol').value;
            all[idx].nivel = all[idx].rol === 'alumno' ? document.getElementById('nivelAlumno').value : '';
            sels.forEach(s => { if (s.id !== 'nuevoRol' && s.id !== 'nivelAlumno' && s.value) all[idx].estado = s.value; });
            DB.set('usuarios', all); renderUsuarios(); initCharts();
            showToast('Usuario actualizado', 'success');
        }
        closeModal('changeStatusModal');
    };
    openModal('changeStatusModal');
}

function deleteUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    DB.set('usuarios', DB.get('usuarios').filter(x => x.id !== id)); renderUsuarios(); initCharts(); showToast('Usuario eliminado', 'success');
}

function addUsuarioManual() {
    showDynModal('Agregar Usuario', '<form id="addUF" class="modal-form"><div class="form-row"><div class="form-group"><label>Nombre *</label><input type="text" id="aUN" required></div><div class="form-group"><label>Apellido *</label><input type="text" id="aUA" required></div></div><div class="form-row"><div class="form-group"><label>DNI *</label><input type="text" id="aUD" maxlength="8" required></div><div class="form-group"><label>Email *</label><input type="email" id="aUE" required></div></div><div class="form-row"><div class="form-group"><label>Teléfono</label><input type="tel" id="aUT" maxlength="9"></div><div class="form-group"><label>Fecha Nacimiento</label><input type="date" id="aUFN"></div></div><div class="form-row"><div class="form-group"><label>Rol *</label><select id="aUR" onchange="document.getElementById(\'aUNW\').style.display=this.value===\'alumno\'?\'block\':\'none\'"><option value="aspirante">Aspirante</option><option value="alumno">Alumno</option><option value="rescatista">Rescatista</option></select></div><div class="form-group" id="aUNW" style="display:none"><label>Nivel</label><select id="aUNV"><option value="bired">BIRED</option><option value="emgra">EMGRA</option></select></div></div><div class="form-row"><div class="form-group"><label>Estado</label><select id="aUS"><option value="activo">Activo</option><option value="suspendido">Suspendido</option><option value="baja">Baja</option></select></div><div class="form-group"><label>Profesión</label><input type="text" id="aUP"></div></div><div class="form-group"><label>Departamento</label><select id="aUDp"><option value="lima">Lima</option><option value="arequipa">Arequipa</option><option value="cusco">Cusco</option><option value="trujillo">La Libertad</option><option value="piura">Piura</option><option value="otros">Otros</option></select></div><div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button><button type="submit" class="btn-primary"><i class="fas fa-save"></i> Guardar</button></div></form>', () => {
        document.getElementById('addUF').addEventListener('submit', function(e) {
            e.preventDefault();
            const all = DB.get('usuarios');
            all.push({ id: DB.nextId('usuarios'), nombre: document.getElementById('aUN').value.trim(), apellido: document.getElementById('aUA').value.trim(), dni: document.getElementById('aUD').value.trim(), email: document.getElementById('aUE').value.trim(), telefono: document.getElementById('aUT').value.trim(), fechaNacimiento: document.getElementById('aUFN').value, genero: '', direccion: '', departamento: document.getElementById('aUDp').value, distrito: '', nivelEducativo: '', profesion: document.getElementById('aUP').value.trim(), motivacion: '', experiencia: false, rol: document.getElementById('aUR').value, nivel: document.getElementById('aUR').value === 'alumno' ? document.getElementById('aUNV').value : '', estado: document.getElementById('aUS').value, fechaIngreso: new Date().toISOString().split('T')[0] });
            DB.set('usuarios', all); renderUsuarios(); initCharts(); closeDynModal(); showToast('Usuario agregado', 'success');
        });
    });
}

function exportUsuarios() {
    const u = DB.get('usuarios');
    let csv = 'ID,Nombre,Apellido,DNI,Email,Teléfono,Rol,Nivel,Estado,Fecha Ingreso,Departamento,Profesión\n';
    u.forEach(x => { csv += '"' + [x.id, x.nombre, x.apellido, x.dni, x.email, x.telefono, x.rol, x.nivel || '-', x.estado, x.fechaIngreso, x.departamento, x.profesion].join('","') + '"\n'; });
    const b = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'usuarios_cgpvp_' + new Date().toISOString().split('T')[0] + '.csv'; l.click();
    showToast('CSV exportado', 'success');
}

console.log('⚠️ Funciones de instructores DESACTIVADAS - Usando instructores-api.js');

// ============================================
// 7. CURSOS CRUD (sin cambios - sigue usando DB)
// ============================================
function renderCursos() {
    const c = document.getElementById('cursos'); 
    if (!c) return;
    const data = DB.get('cursos');
    const g = c.querySelector('.courses-grid'); 
    if (!g) return;
    
    g.innerHTML = data.map(curso => {
        // Determinar si mostrar dirección o enlace según modalidad
        let ubicacionHTML = '';
        if (curso.modalidad.toLowerCase() === 'presencial' && curso.direccion) {
            ubicacionHTML = `<div class="info-item"><i class="fas fa-map-marker-alt"></i><span>${curso.direccion}</span></div>`;
        } else if ((curso.modalidad.toLowerCase() === 'virtual' || curso.modalidad.toLowerCase() === 'semipresencial') && curso.enlace) {
            ubicacionHTML = `<div class="info-item"><i class="fas fa-link"></i><span><a href="${curso.enlace}" target="_blank" style="color: var(--gold); text-decoration: none;">Enlace del curso</a></span></div>`;
        }
        
        return `
            <div class="course-card">
                <div class="course-header">
                    <span class="course-duration">${curso.duracion}</span>
                    <span class="course-modality">${curso.modalidad}</span>
                </div>
                <h3>${curso.titulo}</h3>
                <div class="course-info">
                    <div class="info-item">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${curso.instructor}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${fmtShort(curso.fechaInicio)} - ${fmtShort(curso.fechaFin)}</span>
                    </div>
                    ${ubicacionHTML}
                </div>
                <div class="course-actions">
                    <button class="btn-small btn-primary" onclick="viewCurso(${curso.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-small btn-secondary" onclick="editCurso(${curso.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteCurso(${curso.id})" style="margin-left:auto;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    const p = c.querySelector('.pagination-info'); 
    if (p) p.textContent = 'Mostrando ' + data.length + ' cursos';
}

function viewCurso(id) {
    const c = DB.get('cursos').find(x => x.id === id); 
    if (!c) return;
    
    // Determinar ubicación según modalidad
    let ubicacionHTML = '';
    if (c.modalidad.toLowerCase() === 'presencial' && c.direccion) {
        ubicacionHTML = `<div><b>Dirección:</b> ${c.direccion}</div>`;
    } else if ((c.modalidad.toLowerCase() === 'virtual' || c.modalidad.toLowerCase() === 'semipresencial') && c.enlace) {
        ubicacionHTML = `<div style="grid-column: 1 / -1;"><b>Enlace:</b> <a href="${c.enlace}" target="_blank" style="color: var(--gold); text-decoration: underline;">${c.enlace}</a></div>`;
    }
    
    const modalContent = `
        <div style="text-align:center;margin-bottom:20px;">
            <h3 style="color:var(--navy);">${c.titulo}</h3>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:10px;">
                <span class="badge" style="background:var(--gold);color:white;">${c.duracion}</span>
                <span class="badge" style="background:var(--navy);color:white;">${c.modalidad}</span>
            </div>
        </div>
        <div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:15px;">
            <p>${c.descripcion}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div><b>Instructor:</b> ${c.instructor}</div>
            <div><b>Estado:</b> ${c.estado}</div>
            <div><b>Fecha Inicio:</b> ${fmtLong(c.fechaInicio)}</div>
            <div><b>Fecha Fin:</b> ${fmtLong(c.fechaFin)}</div>
            ${ubicacionHTML}
        </div>
    `;
    
    showDynModal('Detalles del Curso', modalContent);
}

function showAddCursoModal() { showCursoForm(); }
function editCurso(id) { const c = DB.get('cursos').find(x => x.id === id); if (c) showCursoForm(c); }

function showCursoForm(c) {
    const e = !!c;
    
    const formHTML = `
        <form id="cF" class="modal-form">
            <div class="form-group">
                <label>Título *</label>
                <input type="text" id="cT" value="${e ? c.titulo : ''}" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Duración *</label>
                    <input type="text" id="cD" value="${e ? c.duracion : ''}" placeholder="40 horas" required>
                </div>
                <div class="form-group">
                    <label>Modalidad *</label>
                    <select id="cM" required onchange="toggleUbicacionFields()">
                        <option value="presencial" ${e && c.modalidad === 'presencial' ? 'selected' : ''}>Presencial</option>
                        <option value="virtual" ${e && c.modalidad === 'virtual' ? 'selected' : ''}>Virtual</option>
                        <option value="semipresencial" ${e && c.modalidad === 'semipresencial' ? 'selected' : ''}>Semipresencial</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Instructor *</label>
                <input type="text" id="cI" value="${e ? c.instructor : ''}" required>
            </div>
            
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="cDe" rows="3">${e ? c.descripcion : ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha Inicio</label>
                    <input type="date" id="cFI" value="${e ? c.fechaInicio : ''}">
                </div>
                <div class="form-group">
                    <label>Fecha Fin</label>
                    <input type="date" id="cFF" value="${e ? c.fechaFin : ''}">
                </div>
            </div>
            
            <!-- Campo de Dirección (solo para presencial) -->
            <div class="form-group" id="direccionGroup" style="display:none;">
                <label>Dirección <span style="color:#999;">(Para cursos presenciales)</span></label>
                <input type="text" id="cDir" value="${e && c.direccion ? c.direccion : ''}" placeholder="Ej: Sede Lima Centro - Av. Arequipa 1234">
            </div>
            
            <!-- Campo de Enlace (solo para virtual/semipresencial) -->
            <div class="form-group" id="enlaceGroup" style="display:none;">
                <label>Enlace del Curso <span style="color:#999;">(Para cursos virtuales)</span></label>
                <input type="url" id="cEnl" value="${e && c.enlace ? c.enlace : ''}" placeholder="https://zoom.us/j/123456789">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Estado</label>
                    <select id="cE">
                        <option value="activo" ${e && c.estado === 'activo' ? 'selected' : ''}>Activo</option>
                        <option value="inactivo" ${e && c.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-save"></i> ${e ? 'Guardar' : 'Agregar'}
                </button>
            </div>
        </form>
    `;
    
    showDynModal(e ? 'Editar Curso' : 'Nuevo Curso', formHTML, () => {
        // Mostrar/ocultar campos según modalidad inicial
        toggleUbicacionFields();
        
        // Manejar submit del formulario
        document.getElementById('cF').addEventListener('submit', function(ev) {
            ev.preventDefault();
            
            const modalidad = document.getElementById('cM').value;
            const all = DB.get('cursos');
            
            const d = { 
                titulo: document.getElementById('cT').value.trim(), 
                duracion: document.getElementById('cD').value.trim(), 
                modalidad: modalidad, 
                instructor: document.getElementById('cI').value.trim(), 
                descripcion: document.getElementById('cDe').value.trim(), 
                fechaInicio: document.getElementById('cFI').value, 
                fechaFin: document.getElementById('cFF').value, 
                estado: document.getElementById('cE').value, 
                direccion: modalidad === 'presencial' ? document.getElementById('cDir').value.trim() : '',
                enlace: (modalidad === 'virtual' || modalidad === 'semipresencial') ? document.getElementById('cEnl').value.trim() : '',
                imagen: '' 
            };
            
            if (e) { 
                const idx = all.findIndex(x => x.id === c.id); 
                if (idx >= 0) all[idx] = { ...all[idx], ...d }; 
            } else { 
                d.id = DB.nextId('cursos'); 
                all.push(d); 
            }
            
            DB.set('cursos', all); 
            renderCursos(); 
            closeDynModal(); 
            showToast(e ? 'Curso actualizado' : 'Curso agregado', 'success');
        });
    });
}

// Función auxiliar para mostrar/ocultar campos según modalidad
function toggleUbicacionFields() {
    const modalidad = document.getElementById('cM').value;
    const direccionGroup = document.getElementById('direccionGroup');
    const enlaceGroup = document.getElementById('enlaceGroup');
    
    if (modalidad === 'presencial') {
        direccionGroup.style.display = 'block';
        enlaceGroup.style.display = 'none';
    } else if (modalidad === 'virtual' || modalidad === 'semipresencial') {
        direccionGroup.style.display = 'none';
        enlaceGroup.style.display = 'block';
    }
}

function deleteCurso(id) {
    if (!confirm('¿Eliminar este curso?')) return;
    DB.set('cursos', DB.get('cursos').filter(x => x.id !== id)); renderCursos(); showToast('Curso eliminado', 'success');
}

// ============================================
// 8. EVENTOS CRUD (sin cambios - sigue usando DB)
// ============================================
// ⚠️ DESACTIVADO: Funciones de eventos movidas a eventos-api.js
// Estas funciones ahora consumen la API en lugar de usar localStorage
// ============================================
// function renderEventos() {
//     const c = document.getElementById('eventos'); if (!c) return;
//     const data = DB.get('eventos');
//     const g = c.querySelector('.events-grid'); if (!g) return;
//     g.innerHTML = data.map(ev => '<div class="event-card"><div class="event-header"><span class="event-type">' + ev.tipo + '</span><span class="event-status status-' + ev.estado + '">' + fmtEstado(ev.estado) + '</span></div><h3>' + ev.titulo + '</h3><div class="event-details"><div class="event-detail"><i class="fas fa-calendar"></i><span>' + fmtLong(ev.fecha) + '</span></div><div class="event-detail"><i class="fas fa-clock"></i><span>' + ev.horaInicio + ' - ' + ev.horaFin + '</span></div><div class="event-detail"><i class="fas fa-map-marker-alt"></i><span>' + ev.ubicacion + '</span></div></div><div class="event-actions"><button class="btn-small btn-primary" onclick="viewEvento(' + ev.id + ')"><i class="fas fa-eye"></i> Ver</button><button class="btn-small btn-secondary" onclick="editEvento(' + ev.id + ')"><i class="fas fa-edit"></i> Editar</button><button class="btn-icon btn-delete" onclick="deleteEvento(' + ev.id + ')" style="margin-left:auto;"><i class="fas fa-trash"></i></button></div></div>').join('');
//     const p = c.querySelector('.pagination-info'); if (p) p.textContent = 'Mostrando ' + data.length + ' eventos';
// }
// 
// function viewEvento(id) {
//     const ev = DB.get('eventos').find(x => x.id === id); if (!ev) return;
//     showDynModal('Detalles del Evento', '<div style="text-align:center;margin-bottom:20px;"><h3 style="color:var(--navy);">' + ev.titulo + '</h3><span class="badge" style="background:var(--gold);color:white;font-size:14px;padding:8px 16px;margin-top:10px;">' + ev.tipo + '</span></div><div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:15px;"><p>' + ev.descripcion + '</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;"><div><b>Fecha:</b> ' + fmtLong(ev.fecha) + '</div><div><b>Horario:</b> ' + ev.horaInicio + ' - ' + ev.horaFin + '</div><div><b>Ubicación:</b> ' + ev.ubicacion + '</div><div><b>Instructor:</b> ' + ev.instructor + '</div><div><b>Estado:</b> <span class="event-status status-' + ev.estado + '">' + fmtEstado(ev.estado) + '</span></div></div>');
// }
// 
// function showAddEventModal() { showEventoForm(); }
// function editEvento(id) { const ev = DB.get('eventos').find(x => x.id === id); if (ev) showEventoForm(ev); }
// 
// function showEventoForm(ev) {
//     const e = !!ev;
//     showDynModal(e ? 'Editar Evento' : 'Nuevo Evento', '<form id="eF" class="modal-form"><div class="form-group"><label>Título *</label><input type="text" id="eT" value="' + (e ? ev.titulo : '') + '" required></div><div class="form-row"><div class="form-group"><label>Tipo *</label><select id="eTi" required><option value="capacitacion"' + (e && ev.tipo === 'capacitacion' ? ' selected' : '') + '>Capacitación</option><option value="taller"' + (e && ev.tipo === 'taller' ? ' selected' : '') + '>Taller</option><option value="simulacro"' + (e && ev.tipo === 'simulacro' ? ' selected' : '') + '>Simulacro</option><option value="conferencia"' + (e && ev.tipo === 'conferencia' ? ' selected' : '') + '>Conferencia</option></select></div><div class="form-group"><label>Estado *</label><select id="eE" required><option value="programado"' + (e && ev.estado === 'programado' ? ' selected' : '') + '>Programado</option><option value="en-curso"' + (e && ev.estado === 'en-curso' ? ' selected' : '') + '>En Curso</option><option value="finalizado"' + (e && ev.estado === 'finalizado' ? ' selected' : '') + '>Finalizado</option><option value="cancelado"' + (e && ev.estado === 'cancelado' ? ' selected' : '') + '>Cancelado</option></select></div></div><div class="form-group"><label>Descripción</label><textarea id="eDe" rows="3">' + (e ? ev.descripcion : '') + '</textarea></div><div class="form-row"><div class="form-group"><label>Fecha *</label><input type="date" id="eF" value="' + (e ? ev.fecha : '') + '" required></div><div class="form-group"><label>Hora Inicio *</label><input type="time" id="eHI" value="' + (e ? ev.horaInicio : '') + '" required></div><div class="form-group"><label>Hora Fin *</label><input type="time" id="eHF" value="' + (e ? ev.horaFin : '') + '" required></div></div><div class="form-group"><label>Ubicación *</label><input type="text" id="eU" value="' + (e ? ev.ubicacion : '') + '" required></div><div class="form-group"><label>Instructor *</label><input type="text" id="eI" value="' + (e ? ev.instructor : '') + '" required></div><div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeDynModal()">Cancelar</button><button type="submit" class="btn-primary"><i class="fas fa-save"></i> ' + (e ? 'Guardar' : 'Agregar') + '</button></div></form>', () => {
//         document.getElementById('eF').addEventListener('submit', function(evt) {
//             evt.preventDefault();
//             const all = DB.get('eventos');
//             const d = { titulo: document.getElementById('eT').value.trim(), tipo: document.getElementById('eTi').value, descripcion: document.getElementById('eDe').value.trim(), fecha: document.getElementById('eF').value, horaInicio: document.getElementById('eHI').value, horaFin: document.getElementById('eHF').value, ubicacion: document.getElementById('eU').value.trim(), instructor: document.getElementById('eI').value.trim(), estado: document.getElementById('eE').value };
//             if (e) { const idx = all.findIndex(x => x.id === ev.id); if (idx >= 0) all[idx] = { ...all[idx], ...d }; } else { d.id = DB.nextId('eventos'); all.push(d); }
//             DB.set('eventos', all); renderEventos(); closeDynModal(); showToast(e ? 'Evento actualizado' : 'Evento agregado', 'success');
//         });
//     });
// }
// 
// function deleteEvento(id) {
//     if (!confirm('¿Eliminar este evento?')) return;
//     DB.set('eventos', DB.get('eventos').filter(x => x.id !== id)); renderEventos(); showToast('Evento eliminado', 'success');
// }

// ============================================
// ============================================
// 9. NOTICIAS - COMPLETAMENTE MANEJADO POR noticias-api.js
// ============================================
// ⚠️ IMPORTANTE: admin-script.js YA NO interviene en noticias
// Todo se maneja en noticias-api.js con MutationObserver

// Solo mantener showAddNewsModal para el botón del HTML
function showAddNewsModal() { 
    if (typeof window.showAddNewsModal === 'function') {
        window.showAddNewsModal();
    } else {
        openModal('newsModal');
    }
}


// ============================================
// 10. REPORTES (sin cambios)
// ============================================
function exportarReporte() { alert('Funcionalidad de exportar reporte en desarrollo'); }
function generarReporte() {
    const tipo = document.getElementById('reportType')?.value || 'general';
    const periodo = document.getElementById('reportPeriod')?.value || 'mes';
    alert('Generando reporte de tipo: ' + tipo + ' para el período: ' + periodo);
    const rf = document.querySelector('.btn-refresh'); 
    if (rf) rf.addEventListener('click', function() { 
        // initCharts(); // ❌ COMENTADO - dashboard-api.js maneja los gráficos
        if (typeof cargarDashboardCompleto === 'function') cargarDashboardCompleto(); 
        showToast('Dashboard actualizado', 'success'); 
    });
}

// ============================================
// 11. MODALES & UTILIDADES (sin cambios)
// ============================================
function initModals() {
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', function() { closeModal(this.closest('.modal-overlay').id); }));
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', function(e) { if (e.target === this) closeModal(this.id); }));
}
function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; } }
function showModal(id) { openModal(id); }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('active'); document.body.style.overflow = ''; } }

function showDynModal(title, body, cb) {
    let m = document.getElementById('dynModal');
    if (!m) { m = document.createElement('div'); m.className = 'modal-overlay'; m.id = 'dynModal'; m.innerHTML = '<div class="modal-container"><div class="modal-header"><h3 id="dynTitle"></h3><button class="modal-close" onclick="closeDynModal()"><i class="fas fa-times"></i></button></div><div class="modal-body" id="dynBody"></div></div>'; document.body.appendChild(m); m.addEventListener('click', function(e) { if (e.target === this) closeDynModal(); }); }
    document.getElementById('dynTitle').textContent = title;
    document.getElementById('dynBody').innerHTML = body;
    m.classList.add('active'); document.body.style.overflow = 'hidden';
    if (cb) setTimeout(cb, 50);
}
function closeDynModal() { const m = document.getElementById('dynModal'); if (m) { m.classList.remove('active'); document.body.style.overflow = ''; } }

function showToast(msg, type) {
    let c = document.getElementById('toastC');
    if (!c) { c = document.createElement('div'); c.id = 'toastC'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;'; document.body.appendChild(c); }
    const colors = { success: '#43e97b', error: '#e74c3c', warning: '#FDB750', info: '#4facfe' };
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const t = document.createElement('div');
    t.style.cssText = 'background:white;padding:15px 20px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;min-width:300px;border-left:4px solid ' + colors[type] + ';animation:slideInR 0.3s ease-out;font-family:sans-serif;font-size:14px;';
    t.innerHTML = '<i class="fas fa-' + icons[type] + '" style="color:' + colors[type] + ';font-size:18px;"></i><span style="flex:1;">' + msg + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}
if (!document.getElementById('toastS')) { const s = document.createElement('style'); s.id = 'toastS'; s.textContent = '@keyframes slideInR{from{opacity:0;transform:translateX(100px);}to{opacity:1;transform:translateX(0);}}'; document.head.appendChild(s); }

// Paginación
function renderPag(sel, total, pages, cur, fn) {
    const c = document.querySelector(sel); if (!c) return;
    const i = c.querySelector('.pagination-info');
    const ct = c.querySelector('.pagination-controls');
    const s = (cur - 1) * USR_PP + 1, e = Math.min(cur * USR_PP, total);
    if (i) i.textContent = 'Mostrando ' + (total > 0 ? s : 0) + ' a ' + e + ' de ' + total.toLocaleString() + ' resultados';
    if (ct) {
        let h = '<button class="btn-pagination"' + (cur === 1 ? ' disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        const ps = [];
        if (pages <= 7) { for (let j = 1; j <= pages; j++) ps.push(j); } else { ps.push(1); if (cur > 3) ps.push('...'); for (let j = Math.max(2, cur - 1); j <= Math.min(pages - 1, cur + 1); j++) ps.push(j); if (cur < pages - 2) ps.push('...'); ps.push(pages); }
        ps.forEach(p => { if (p === '...') h += '<button class="btn-pagination" disabled>...</button>'; else h += '<button class="btn-pagination' + (p === cur ? ' active' : '') + '">' + p + '</button>'; });
        h += '<button class="btn-pagination"' + (cur === pages ? ' disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        ct.innerHTML = h;
        ct.querySelectorAll('.btn-pagination').forEach(b => { b.addEventListener('click', function() { const txt = this.textContent.trim(); if (this.disabled || txt === '...') return; let np = cur; if (this.querySelector('.fa-chevron-left')) np = cur - 1; else if (this.querySelector('.fa-chevron-right')) np = cur + 1; else np = parseInt(txt); if (np >= 1 && np <= pages) fn(np); }); });
    }
}

// Helpers
function fmtShort(d) { if (!d) return '-'; const x = new Date(d + 'T00:00:00'); if (isNaN(x)) return d; return x.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function fmtLong(d) { if (!d) return '-'; const x = new Date(d + 'T00:00:00'); if (isNaN(x)) return d; return x.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }); }
function fmtEstado(e) { return { 'programado': 'Programado', 'en-curso': 'En Curso', 'finalizado': 'Finalizado', 'cancelado': 'Cancelado' }[e] || e; }

// ============================================
// 12. FUNCIONES EXISTENTES (sin cambios)
// ============================================
let originalPhoto = 'perfil/admin.jpeg';
function previewPhoto(ev) { const f = ev.target.files[0]; if (f) { if (f.size > 2 * 1024 * 1024) { alert('Máximo 2MB.'); ev.target.value = ''; return; } const r = new FileReader(); r.onload = function(e) { const p = document.getElementById('profilePreview'); const s = document.querySelector('.profile-avatar img'); const t = document.querySelector('.admin-avatar img'); if (p) p.src = e.target.result; if (s) s.src = e.target.result; if (t) t.src = e.target.result; }; r.readAsDataURL(f); } }
function restoreOriginalPhoto() { const p = document.getElementById('profilePreview'); const s = document.querySelector('.profile-avatar img'); const t = document.querySelector('.admin-avatar img'); const i = document.getElementById('photoUpload'); if (p) p.src = originalPhoto; if (s) s.src = originalPhoto; if (t) t.src = originalPhoto; if (i) i.value = ''; }
function openProfileModal() { const c = document.querySelector('.profile-avatar img'); if (c) originalPhoto = c.src; openModal('profileModal'); }
function openLogoutModal() { openModal('logoutModal'); }
function confirmLogout() { 
    console.log('🚪 Cerrando sesión...');
    
    // Si existe la API de Admin, llamar a su función logout
    if (window.API && window.API.Admin && typeof window.API.Admin.logout === 'function') {
        window.API.Admin.logout();
        return;
    }
    
    // Si no existe API, limpiar manualmente
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('cgpvp_usuarios');
    localStorage.removeItem('cgpvp_instructores');
    localStorage.removeItem('cgpvp_cursos');
    localStorage.removeItem('cgpvp_eventos');
    localStorage.removeItem('cgpvp_noticias');
    
    console.log('✅ Sesión cerrada. Redirigiendo...');
    
    // Redirigir al login
    window.location.href = 'index.html'; 
}

document.addEventListener('DOMContentLoaded', function() {
    const pf = document.getElementById('profileForm');
    if (pf) pf.addEventListener('submit', function(e) { e.preventDefault(); const p = document.getElementById('profilePreview'); if (p) originalPhoto = p.src; showToast('Perfil actualizado', 'success'); closeModal('profileModal'); });
});

function toggleNivelField() { const r = document.getElementById('nuevoRol'); const n = document.getElementById('nivelField'); const s = document.getElementById('nivelAlumno'); if (r && n) { if (r.value === 'alumno') { n.style.display = 'block'; if (s) s.required = true; } else { n.style.display = 'none'; if (s) { s.required = false; s.value = ''; } } } }

function previewNewsImage(ev) { const f = ev.target.files[0]; if (f) { const r = new FileReader(); r.onload = function(e) { document.getElementById('newsImagePreviewImg').src = e.target.result; document.getElementById('newsImagePreview').style.display = 'block'; document.getElementById('newsUploadPlaceholder').style.display = 'none'; }; r.readAsDataURL(f); } }
function removeNewsImage() { const i = document.getElementById('newsImageInput'); const p = document.getElementById('newsImagePreview'); const pl = document.getElementById('newsUploadPlaceholder'); if (i) i.value = ''; if (p) p.style.display = 'none'; if (pl) pl.style.display = 'flex'; }

document.addEventListener('DOMContentLoaded', function() { const u = document.getElementById('newsImageUpload'); if (u) u.addEventListener('click', function(e) { if (!e.target.closest('.btn-remove-image')) document.getElementById('newsImageInput').click(); }); });

// ============================================
// EXPORTAR FUNCIONES AL SCOPE GLOBAL
// ============================================
window.showDynModal = showDynModal;
window.closeDynModal = closeDynModal;
window.showToast = showToast;

console.log('✅ admin-script.js MODIFICADO cargado - Instructores y Cursos usan API');