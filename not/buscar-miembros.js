// ============================================
// BUSCADOR DE MIEMBROS - NAVBAR CON MODAL
// ============================================

(function() {
    'use strict';
    
    // ⚙️ Configuración del API — montado en main.py como /api/miembros
    const API_BASE_URL = 'http://localhost:8000/api/miembros';
    
    // Elementos del DOM
    let searchInput = null;
    let searchBtn = null;
    let resultsContainer = null;
    let modalOverlay = null;
    
    // Debounce timer
    let searchTimeout = null;
    
    /**
     * Inicializar el buscador cuando el DOM esté listo
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSearcher);
        } else {
            setupSearcher();
        }
    }
    
    /**
     * Configurar el buscador
     */
    function setupSearcher() {
        searchInput = document.getElementById('navbarSearchInput');
        searchBtn = document.querySelector('.navbar-search .search-btn');
        
        if (!searchInput) {
            console.warn('No se encontró el input de búsqueda en el navbar');
            return;
        }
        
        createResultsContainer();
        createModal();
        
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchFocus);
        searchInput.addEventListener('blur', handleSearchBlur);
        
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearchClick);
        }
        
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        
        // Si la URL ya trae ?m=<hash>, cargar ese miembro automáticamente
        checkUrlParam();
        
        console.log('✅ Buscador de miembros inicializado');
    }
    
    /**
     * Crear contenedor de resultados (dropdown)
     */
    function createResultsContainer() {
        const navbarSearch = document.querySelector('.navbar-search');
        if (!navbarSearch) return;
        
        const old = document.getElementById('searchResults');
        if (old) old.remove();
        
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'searchResults';
        resultsContainer.className = 'search-results-dropdown';
        resultsContainer.style.display = 'none';
        
        navbarSearch.appendChild(resultsContainer);
    }
    
    /**
     * Crear modal para mostrar detalle del miembro
     */
    function createModal() {
        const old = document.getElementById('memberModal');
        if (old) old.remove();
        
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'memberModal';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <button class="modal-close" onclick="closeMemberModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-member-header">
                        <div id="modalMemberPhoto"></div>
                        <div class="modal-member-info">
                            <h2 id="modalMemberName">Cargando...</h2>
                            <div id="modalMemberStatus"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="modal-member-grid">
                        <!-- Columna izquierda: datos -->
                        <div class="modal-info-section">
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-id-card"></i> DNI
                                </div>
                                <div class="modal-info-value" id="modalMemberDNI">-</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-hashtag"></i> Legajo
                                </div>
                                <div class="modal-info-value" id="modalMemberLegajo">-</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-medal"></i> Rango
                                </div>
                                <div class="modal-info-value" id="modalMemberRango">-</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-building"></i> Jefatura
                                </div>
                                <div class="modal-info-value" id="modalMemberJefatura">-</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-briefcase"></i> Profesión
                                </div>
                                <div class="modal-info-value" id="modalMemberProfesion">-</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-calendar-alt"></i> Ingreso
                                </div>
                                <div class="modal-info-value" id="modalMemberIngreso">-</div>
                            </div>
                        </div>
                        
                        <!-- Columna derecha: foto grande -->
                        <div class="modal-qr-section">
                            <div class="modal-qr-title">
                                <i class="fas fa-user-circle"></i>
                                Foto del Miembro
                            </div>
                            <div class="modal-qr-container" id="modalBigPhotoContainer">
                                <!-- Se rellena dinámicamente -->
                            </div>
                            <div class="modal-qr-id" id="modalMemberLegajoLabel"></div>
                        </div>
                    </div>
                    
                    <div class="modal-update-date">
                        <i class="fas fa-clock"></i>
                        <span id="modalUpdateDate">Última actualización: -</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
    
    // ============================================
    // HANDLERS DE EVENTOS
    // ============================================
    
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length === 0) {
            hideResults();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) buscarMiembros(query);
        }, 500);
    }
    
    function handleSearchFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= 2 && resultsContainer.innerHTML) {
            showResults();
        }
    }
    
    function handleSearchBlur() {
        setTimeout(() => {
            if (!resultsContainer.matches(':hover')) hideResults();
        }, 200);
    }
    
    function handleSearchClick(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query.length >= 2) buscarMiembros(query);
    }
    
    function handleOutsideClick(e) {
        const navbarSearch = document.querySelector('.navbar-search');
        if (navbarSearch && !navbarSearch.contains(e.target)) hideResults();
    }
    
    // ============================================
    // LLAMADAS AL API
    // ============================================
    
    /**
     * POST /buscar — busca miembros por nombre, apellido, DNI o legajo
     */
    async function buscarMiembros(criterio) {
        console.log(`🔍 Buscando: "${criterio}"`);
        showLoading();
        
        try {
            const response = await fetch(`${API_BASE_URL}/buscar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criterio })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.status === 'No se encontraron miembros' || !data.resultados?.length) {
                mostrarSinResultados(criterio);
            } else {
                console.log(`✅ Encontrados: ${data.resultados.length} miembros`);
                mostrarResultados(data.resultados, criterio);
            }
            
        } catch (error) {
            console.error('Error al buscar miembros:', error);
            mostrarError('Error al realizar la búsqueda. Intenta nuevamente.');
        }
    }
    
    /**
     * POST /buscar-por-hash — carga el detalle completo de un miembro por hash MD5 de su ID
     */
    async function buscarMiembroPorHash(hash) {
        try {
            const response = await fetch(`${API_BASE_URL}/buscar-por-hash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.miembro || null;
            
        } catch (error) {
            console.error('Error al buscar por hash:', error);
            return null;
        }
    }
    
    // ============================================
    // RENDERIZADO DE RESULTADOS (DROPDOWN)
    // ============================================
    
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="search-result-item loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Buscando...</span>
            </div>`;
        showResults();
    }
    
    function mostrarError(mensaje) {
        resultsContainer.innerHTML = `
            <div class="search-result-item error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${mensaje}</span>
            </div>`;
        showResults();
    }
    
    function mostrarSinResultados(criterio) {
        resultsContainer.innerHTML = `
            <div class="search-result-item no-results">
                <i class="fas fa-search"></i>
                <span>No se encontraron miembros con "<strong>${criterio}</strong>"</span>
            </div>`;
        showResults();
    }
    
    function mostrarResultados(miembros, criterio) {
        const limitados = miembros.slice(0, 10);
        let html = '';
        
        limitados.forEach(miembro => {
            const nombre = miembro.nombre_completo || `${miembro.apellido || ''} ${miembro.nombre || ''}`.trim() || 'Sin nombre';
            const dni = miembro.dni || 'Sin DNI';
            const rango = miembro.rango || 'Miembro';
            const foto = miembro.foto_perfil || null;
            
            // El hash MD5 del id viene del SP a través del campo codigo_qr,
            // o lo calculamos en el cliente si el backend lo devuelve directamente.
            // Usamos el id para armar el hash al hacer click (ver openMemberDetail).
            const dataAttr = encodeURIComponent(JSON.stringify(miembro));
            
            html += `
                <div class="search-result-item" data-miembro="${dataAttr}">
                    ${foto
                        ? `<img src="${foto}" alt="${nombre}" class="result-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                           <div class="result-avatar-placeholder" style="display:none;"><i class="fas fa-user"></i></div>`
                        : `<div class="result-avatar-placeholder"><i class="fas fa-user"></i></div>`
                    }
                    <div class="result-info">
                        <div class="result-name">${nombre}</div>
                        <div class="result-details">
                            <span><i class="fas fa-id-card"></i> ${dni}</span>
                            <span><i class="fas fa-medal"></i> ${rango}</span>
                        </div>
                    </div>
                </div>`;
        });
        
        if (miembros.length > 10) {
            html += `
                <div class="search-result-footer">
                    Mostrando 10 de ${miembros.length} resultados
                </div>`;
        }
        
        resultsContainer.innerHTML = html;
        showResults();
        
        // Click en cada resultado → abrir modal
        resultsContainer.querySelectorAll('.search-result-item[data-miembro]').forEach(item => {
            item.addEventListener('click', () => {
                const miembro = JSON.parse(decodeURIComponent(item.dataset.miembro));
                mostrarModalMiembro(miembro);
            });
        });
    }
    
    // ============================================
    // MODAL DE DETALLE
    // ============================================
    
    /**
     * Muestra el modal con los datos que ya tenemos del listado.
     * Si el miembro tiene un id, opcionalmente podemos recargar el detalle completo
     * llamando a /buscar-por-hash para obtener datos actualizados.
     */
    async function mostrarModalMiembro(miembro) {
        hideResults();
        
        // Mostrar modal con los datos que ya tenemos mientras cargamos
        renderModal(miembro);
        openModal();
        
        // Agregar ?m=<hash> a la URL para que sea compartible
        // Preferimos el hash que viene del backend (UTF-16 LE = mismo que SQL Server)
        // Si no viene, lo calculamos localmente como fallback
        const hashParaUrl = miembro.hash || (miembro.id ? md5(String(miembro.id)) : null);
        if (hashParaUrl) {
            setUrlParam(hashParaUrl);
        }
        
        // Si tenemos el id, recargamos desde /buscar-por-hash para datos frescos
        if (miembro.id) {
            const hash = md5(String(miembro.id));
            const detalle = await buscarMiembroPorHash(hash);
            if (detalle) renderModal(detalle); // actualiza el modal con datos completos
        }
    }
    
    /**
     * Rellena el modal con los datos del miembro
     */
    function renderModal(m) {
        const nombreCompleto = m.nombre_completo
            || `${m.apellido || ''} ${m.nombre || ''}`.trim()
            || 'Sin nombre';
        
        const dni          = m.dni           || 'No registrado';
        const legajo       = m.legajo        || 'No asignado';
        const rango        = m.rango         || 'No especificado';
        const jefatura     = m.jefatura      || 'No asignado';
        const profesion    = m.profesion     || 'No especificado';
        const estado       = (m.estado       || 'activo').toLowerCase();
        const foto         = m.foto_perfil   || null;
        const fechaIngreso = m.fecha_ingreso
            ? new Date(m.fecha_ingreso).toLocaleDateString('es-PE')
            : 'No registrada';
        const fechaUpdate  = m.fecha_ultimo_cambio
            ? new Date(m.fecha_ultimo_cambio).toLocaleString('es-PE')
            : '-';
        
        // -- Foto en el header --
        const photoContainer = document.getElementById('modalMemberPhoto');
        if (foto) {
            photoContainer.innerHTML = `
                <img src="${foto}" alt="${nombreCompleto}" class="modal-member-photo"
                     onerror="this.outerHTML='<div class=\\'modal-member-photo-placeholder\\'><i class=\\'fas fa-user\\'></i></div>'">`;
        } else {
            photoContainer.innerHTML = `<div class="modal-member-photo-placeholder"><i class="fas fa-user"></i></div>`;
        }
        
        // -- Nombre --
        document.getElementById('modalMemberName').textContent = nombreCompleto;
        
        // -- Estado --
        const statusMap = {
            activo:     { icon: 'fa-check-circle',  cls: 'activo',     label: 'ACTIVO'     },
            baja:       { icon: 'fa-times-circle',  cls: 'baja',       label: 'BAJA'       },
            inactivo:   { icon: 'fa-times-circle',  cls: 'baja',       label: 'INACTIVO'   },
            suspendido: { icon: 'fa-pause-circle',  cls: 'suspendido', label: 'SUSPENDIDO' },
        };
        const st = statusMap[estado] || statusMap.activo;
        document.getElementById('modalMemberStatus').innerHTML = `
            <div class="modal-member-status ${st.cls}">
                <i class="fas ${st.icon}"></i> ${st.label}
            </div>`;
        
        // -- Datos de texto --
        document.getElementById('modalMemberDNI').textContent      = dni;
        document.getElementById('modalMemberLegajo').textContent   = legajo;
        document.getElementById('modalMemberRango').textContent    = rango;
        document.getElementById('modalMemberJefatura').textContent = jefatura;
        document.getElementById('modalMemberProfesion').textContent = profesion;
        document.getElementById('modalMemberIngreso').textContent  = fechaIngreso;
        document.getElementById('modalUpdateDate').textContent     = `Última actualización: ${fechaUpdate}`;
        
        // -- Foto grande (panel derecho, donde antes estaba el QR) --
        const bigPhotoContainer = document.getElementById('modalBigPhotoContainer');
        if (foto) {
            bigPhotoContainer.innerHTML = `
                <img src="${foto}" alt="${nombreCompleto}"
                     id="memberBigPhoto"
                     style="width:200px;height:200px;object-fit:cover;border-radius:8px;"
                     onerror="this.outerHTML='<div style=\\'width:200px;height:200px;display:flex;align-items:center;justify-content:center;font-size:60px;color:var(--gold)\\'><i class=\\'fas fa-user-circle\\'></i></div>'">`;
        } else {
            bigPhotoContainer.innerHTML = `
                <div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;font-size:60px;color:var(--gold);">
                    <i class="fas fa-user-circle"></i>
                </div>`;
        }
        
        // -- Etiqueta del legajo debajo de la foto --
        document.getElementById('modalMemberLegajoLabel').textContent = legajo ? `Legajo: ${legajo}` : '';
    }
    
    // ============================================
    // URL PARAM — ?m=<hash>
    // ============================================

    /**
     * Lee ?m=<hash> de la URL al cargar la página y abre la card si existe
     */
    async function checkUrlParam() {
        const params = new URLSearchParams(window.location.search);
        const hash = params.get('m');
        if (!hash || hash.length !== 32) return;
        
        console.log('🔗 Hash en URL detectado:', hash);
        
        // Mostrar el modal en estado de carga mientras se busca
        openModalLoading();
        
        const miembro = await buscarMiembroPorHash(hash);
        if (miembro) {
            renderModal(miembro);
        } else {
            closeModal();
            console.warn('No se encontró el miembro para el hash:', hash);
        }
    }

    /**
     * Abre el modal mostrando un spinner mientras carga (para acceso directo por URL)
     */
    function openModalLoading() {
        // Poner valores vacíos/spinner antes de que lleguen los datos
        const photoContainer = document.getElementById('modalMemberPhoto');
        photoContainer.innerHTML = `<div class="modal-member-photo-placeholder"><i class="fas fa-spinner fa-spin"></i></div>`;
        document.getElementById('modalMemberName').textContent = 'Cargando...';
        document.getElementById('modalMemberStatus').innerHTML = '';
        ['modalMemberDNI','modalMemberLegajo','modalMemberRango',
         'modalMemberJefatura','modalMemberProfesion','modalMemberIngreso'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });
        document.getElementById('modalBigPhotoContainer').innerHTML = `
            <div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;font-size:40px;color:var(--gold);">
                <i class="fas fa-spinner fa-spin"></i>
            </div>`;
        openModal();
    }

    /**
     * Agrega ?m=<hash> a la URL actual sin recargar la página
     */
    function setUrlParam(hash) {
        const url = new URL(window.location.href);
        url.searchParams.set('m', hash);
        window.history.pushState({ miembroHash: hash }, '', url.toString());
    }

    /**
     * Elimina el parámetro ?m de la URL sin recargar la página
     */
    function clearUrlParam() {
        const url = new URL(window.location.href);
        url.searchParams.delete('m');
        window.history.pushState({}, '', url.toString());
    }

    // ============================================
    // MD5 CLIENT-SIDE (mismo algoritmo que SQL Server)
    // Necesario para construir el hash que espera /buscar-por-hash
    // ============================================
    
    /**
     * Implementación MD5 en JavaScript.
     * Produce el mismo resultado que HASHBYTES('MD5', ...) con representación hexadecimal.
     */
    function md5(str) {
        function safeAdd(x, y) {
            const lsw = (x & 0xffff) + (y & 0xffff);
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xffff);
        }
        function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
        function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
        function md5ff(a,b,c,d,x,s,t){ return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
        function md5gg(a,b,c,d,x,s,t){ return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
        function md5hh(a,b,c,d,x,s,t){ return md5cmn(b^c^d,a,b,x,s,t); }
        function md5ii(a,b,c,d,x,s,t){ return md5cmn(c^(b|(~d)),a,b,x,s,t); }
        
        const binaryStr = unescape(encodeURIComponent(str));
        const m = [];
        for (let i = 0; i < binaryStr.length; i++) m[i >> 2] |= binaryStr.charCodeAt(i) << ((i % 4) * 8);
        m[binaryStr.length >> 2] |= 0x80 << ((binaryStr.length % 4) * 8);
        m[14 + (((binaryStr.length + 8) >> 6) << 4)] = binaryStr.length * 8;
        
        let a =  1732584193, b = -271733879, c = -1732584194, d =  271733878;
        
        for (let i = 0; i < m.length; i += 16) {
            const [aa, bb, cc, dd] = [a, b, c, d];
            a = md5ff(a,b,c,d,m[i+ 0], 7,-680876936);  b = md5ff(d,a,b,c,m[i+ 1],12,-389564586);
            c = md5ff(c,d,a,b,m[i+ 2],17, 606105819);  d = md5ff(b,c,d,a,m[i+ 3],22,-1044525330);
            a = md5ff(a,b,c,d,m[i+ 4], 7,-176418897);  b = md5ff(d,a,b,c,m[i+ 5],12, 1200080426);
            c = md5ff(c,d,a,b,m[i+ 6],17,-1473231341); d = md5ff(b,c,d,a,m[i+ 7],22,-45705983);
            a = md5ff(a,b,c,d,m[i+ 8], 7, 1770035416); b = md5ff(d,a,b,c,m[i+ 9],12,-1958414417);
            c = md5ff(c,d,a,b,m[i+10],17,-42063);       d = md5ff(b,c,d,a,m[i+11],22,-1990404162);
            a = md5ff(a,b,c,d,m[i+12], 7, 1804603682); b = md5ff(d,a,b,c,m[i+13],12,-40341101);
            c = md5ff(c,d,a,b,m[i+14],17,-1502002290); d = md5ff(b,c,d,a,m[i+15],22, 1236535329);
            a = md5gg(a,b,c,d,m[i+ 1], 5,-165796510);  b = md5gg(d,a,b,c,m[i+ 6], 9,-1069501632);
            c = md5gg(c,d,a,b,m[i+11],14, 643717713);  d = md5gg(b,c,d,a,m[i+ 0],20,-373897302);
            a = md5gg(a,b,c,d,m[i+ 5], 5,-701558691);  b = md5gg(d,a,b,c,m[i+10], 9, 38016083);
            c = md5gg(c,d,a,b,m[i+15],14,-660478335);  d = md5gg(b,c,d,a,m[i+ 4],20,-405537848);
            a = md5gg(a,b,c,d,m[i+ 9], 5, 568446438);  b = md5gg(d,a,b,c,m[i+14], 9,-1019803690);
            c = md5gg(c,d,a,b,m[i+ 3],14,-187363961);  d = md5gg(b,c,d,a,m[i+ 8],20, 1163531501);
            a = md5gg(a,b,c,d,m[i+13], 5,-1444681467); b = md5gg(d,a,b,c,m[i+ 2], 9,-51403784);
            c = md5gg(c,d,a,b,m[i+ 7],14, 1735328473); d = md5gg(b,c,d,a,m[i+12],20,-1926607734);
            a = md5hh(a,b,c,d,m[i+ 5], 4,-378558);     b = md5hh(d,a,b,c,m[i+ 8],11,-2022574463);
            c = md5hh(c,d,a,b,m[i+11],16, 1839030562); d = md5hh(b,c,d,a,m[i+14],23,-35309556);
            a = md5hh(a,b,c,d,m[i+ 1], 4,-1530992060); b = md5hh(d,a,b,c,m[i+ 4],11, 1272893353);
            c = md5hh(c,d,a,b,m[i+ 7],16,-155497632);  d = md5hh(b,c,d,a,m[i+10],23,-1094730640);
            a = md5hh(a,b,c,d,m[i+13], 4, 681279174);  b = md5hh(d,a,b,c,m[i+ 0],11,-358537222);
            c = md5hh(c,d,a,b,m[i+ 3],16,-722521979);  d = md5hh(b,c,d,a,m[i+ 6],23, 76029189);
            a = md5hh(a,b,c,d,m[i+ 9], 4,-640364487);  b = md5hh(d,a,b,c,m[i+12],11,-421815835);
            c = md5hh(c,d,a,b,m[i+15],16, 530742520);  d = md5hh(b,c,d,a,m[i+ 2],23,-995338651);
            a = md5ii(a,b,c,d,m[i+ 0], 6,-198630844);  b = md5ii(d,a,b,c,m[i+ 7],10, 1126891415);
            c = md5ii(c,d,a,b,m[i+14],15,-1416354905); d = md5ii(b,c,d,a,m[i+ 5],21,-57434055);
            a = md5ii(a,b,c,d,m[i+12], 6, 1700485571); b = md5ii(d,a,b,c,m[i+ 3],10,-1894986606);
            c = md5ii(c,d,a,b,m[i+10],15,-1051523);    d = md5ii(b,c,d,a,m[i+ 1],21,-2054922799);
            a = md5ii(a,b,c,d,m[i+ 8], 6, 1873313359); b = md5ii(d,a,b,c,m[i+15],10,-30611744);
            c = md5ii(c,d,a,b,m[i+ 6],15,-1560198380); d = md5ii(b,c,d,a,m[i+13],21, 1309151649);
            a = md5ii(a,b,c,d,m[i+ 4], 6,-145523070);  b = md5ii(d,a,b,c,m[i+11],10,-1120210379);
            c = md5ii(c,d,a,b,m[i+ 2],15, 718787259);  d = md5ii(b,c,d,a,m[i+ 9],21,-343485551);
            a = safeAdd(a,aa); b = safeAdd(b,bb); c = safeAdd(c,cc); d = safeAdd(d,dd);
        }
        
        return [a,b,c,d].map(n =>
            ('0000000' + ((n < 0 ? n + 0x100000000 : n)).toString(16)).slice(-8)
                .match(/../g).reverse().join('')
        ).join('');
    }
    
    // ============================================
    // HELPERS DEL MODAL
    // ============================================
    
    function openModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        clearUrlParam();
    }
    
    window.closeMemberModal = closeModal;
    
    function showResults() { resultsContainer.style.display = 'block'; }
    function hideResults()  { resultsContainer.style.display = 'none';  }
    
    // Inicializar
    init();
    
})();