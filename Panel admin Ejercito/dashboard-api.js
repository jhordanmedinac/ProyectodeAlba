const DASHBOARD_API = "https://paramedicosdelperu.org/api/admin/dashboard";
let chartMiembrosRango = null;
let chartMiembrosEstado = null;
let chartPostulantesMes = null;
let chartMiembrosDepartamento = null;
let chartEdadesMiembros = null;
let chartOcupacionCursos = null;

// ══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Dashboard API inicializado");
    
    // Cargar todos los datos del dashboard
    cargarDashboardCompleto();
    
    // Botón de refresh
    const btnRefresh = document.querySelector('.btn-refresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            cargarDashboardCompleto();
            showToast('Dashboard actualizado', 'success');
        });
    }
    
    // Auto-refresh cada 5 minutos (opcional)
    // setInterval(cargarDashboardCompleto, 300000);
});

// ══════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: CARGAR TODO EL DASHBOARD
// ══════════════════════════════════════════════════════════════════
async function cargarDashboardCompleto() {
    try {
        console.log("📊 Cargando dashboard completo...");
        
        mostrarLoaderDashboard();
        
        await cargarKPIs();
        await cargarGraficoMiembrosRango();
        
        await Promise.all([
            cargarGraficoMiembrosEstado(),
            cargarGraficoPostulantesMes(),
            cargarGraficoMiembrosDepartamento(),
            cargarGraficoEdadesMiembros(),
            cargarGraficoOcupacionCursos(),
            cargarActividadReciente()
        ]);
        
        console.log("✅ Dashboard cargado exitosamente");
        
    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
        showToast('Error al cargar el dashboard', 'error');
    } finally {
        ocultarLoaderDashboard();
    }
}

// ══════════════════════════════════════════════════════════════════
// 1. CARGAR KPIs PRINCIPALES
// ══════════════════════════════════════════════════════════════════
async function cargarKPIs() {
    try {
        const response = await fetch(`${DASHBOARD_API}/`);
        const result = await response.json();
        
        console.log("📦 KPIs recibidos del endpoint principal:", result);
        
        if (result.status === "SUCCESS" && result.data) {
            const kpis = result.data;
            
            // Obtener todas las KPI cards
            const kpiCards = document.querySelectorAll('.kpi-card');
            console.log("📊 KPI Cards encontradas:", kpiCards.length);
            
            // Total de Inscritos (primera card - índice 0)
            if (kpis.total_inscritos !== undefined && kpiCards[0]) {
                const valorElement = kpiCards[0].querySelector('.kpi-value');
                if (valorElement) {
                    const valorActual = parseInt(valorElement.textContent.replace(/,/g, '')) || 0;
                    animarContador(valorElement, valorActual, parseInt(kpis.total_inscritos) || 0, 1000);
                    console.log("✅ Total Inscritos actualizado:", kpis.total_inscritos);
                }
            }
            
            // Aspirantes (segunda card - índice 1)
            if (kpis.aspirantes !== undefined && kpiCards[1]) {
                const valorElement = kpiCards[1].querySelector('.kpi-value');
                if (valorElement) {
                    const valorActual = parseInt(valorElement.textContent.replace(/,/g, '')) || 0;
                    animarContador(valorElement, valorActual, parseInt(kpis.aspirantes) || 0, 1000);
                    console.log("✅ Aspirantes actualizado:", kpis.aspirantes);
                }
            }
            
            // Alumnos (tercera card - índice 2)
            if (kpis.alumnos !== undefined && kpiCards[2]) {
                const valorElement = kpiCards[2].querySelector('.kpi-value');
                if (valorElement) {
                    const valorActual = parseInt(valorElement.textContent.replace(/,/g, '')) || 0;
                    animarContador(valorElement, valorActual, parseInt(kpis.alumnos) || 0, 1000);
                    console.log("✅ Alumnos actualizado:", kpis.alumnos);
                }
                
                // Actualizar subtítulo de alumnos con desglose
                const subtituloAlumnos = kpiCards[2].querySelector('.kpi-subtitle');
                if (subtituloAlumnos && kpis.alumnos_bired !== undefined && kpis.alumnos_emgra !== undefined) {
                    subtituloAlumnos.textContent = `BIRED: ${kpis.alumnos_bired || 0} | EMGRA: ${kpis.alumnos_emgra || 0}`;
                    console.log("✅ Desglose alumnos actualizado: BIRED:", kpis.alumnos_bired, "EMGRA:", kpis.alumnos_emgra);
                }
            }
            
            // Rescatistas (cuarta card - índice 3)
            if (kpis.rescatistas !== undefined && kpiCards[3]) {
                const valorElement = kpiCards[3].querySelector('.kpi-value');
                if (valorElement) {
                    const valorActual = parseInt(valorElement.textContent.replace(/,/g, '')) || 0;
                    animarContador(valorElement, valorActual, parseInt(kpis.rescatistas) || 0, 1000);
                    console.log("✅ Rescatistas actualizado:", kpis.rescatistas);
                }
            }
            
            // Otros KPIs generales si existen
            if (kpis.total_instructores !== undefined) actualizarKPIGeneral('instructores', kpis.total_instructores);
            if (kpis.total_cursos       !== undefined) actualizarKPIGeneral('cursos',       kpis.total_cursos);
            if (kpis.total_eventos      !== undefined) actualizarKPIGeneral('eventos',      kpis.total_eventos);
            if (kpis.total_publicaciones !== undefined) actualizarKPIGeneral('publicaciones', kpis.total_publicaciones);
        }
    } catch (error) {
        console.error("❌ Error cargando KPIs:", error);
    }
}

function actualizarKPI(selector, valor) {
    const elemento = document.querySelector(selector);
    if (elemento) {
        const valorActual = parseInt(elemento.textContent.replace(/,/g, '')) || 0;
        animarContador(elemento, valorActual, parseInt(valor) || 0, 1000);
    }
}

function actualizarKPIGeneral(tipo, valor) {
    const mapeo = {
        'instructores': 'instructor',
        'cursos': 'curso',
        'eventos': 'evento',
        'publicaciones': 'noticia'
    };
    document.querySelectorAll('.kpi-card').forEach(tarjeta => {
        const titulo = tarjeta.querySelector('h3');
        if (!titulo) return;
        if (titulo.textContent.toLowerCase().includes(mapeo[tipo])) {
            const elemento = tarjeta.querySelector('.kpi-value');
            if (elemento) animarContador(elemento, parseInt(elemento.textContent.replace(/,/g, '')) || 0, parseInt(valor) || 0, 1000);
        }
    });
}

function animarContador(elemento, desde, hasta, duracion) {
    const incremento = (hasta - desde) / (duracion / 16);
    let valorActual = desde;
    const timer = setInterval(() => {
        valorActual += incremento;
        if ((incremento > 0 && valorActual >= hasta) || (incremento < 0 && valorActual <= hasta) || incremento === 0) {
            elemento.textContent = hasta.toLocaleString('es-PE');
            clearInterval(timer);
        } else {
            elemento.textContent = Math.floor(valorActual).toLocaleString('es-PE');
        }
    }, 16);
}

// ══════════════════════════════════════════════════════════════════
// 2. GRÁFICO: MIEMBROS POR RANGO
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoMiembrosRango() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/miembros-rango`);
        const result = await response.json();
        
        console.log("📊 Miembros por rango:", result);
        
        if (result.status === "SUCCESS" && result.data) {
            const labels  = result.data.map(item => item.rango    || 'Sin rango');
            const valores = result.data.map(item => item.cantidad || 0);
            
            // ⚠️ COMENTADO: Los KPIs ya se cargan desde el endpoint principal (cargarKPIs)
            // calcularKPIsDesdeRangos(result.data);
            
            crearGraficoMiembrosRango(labels, valores);
        }
    } catch (error) {
        console.error("❌ Error cargando gráfico de rangos:", error);
    }
}

// ✨ FUNCIÓN CORREGIDA - Filtra exactamente por "Alumno - BIRED" y "Alumno - EMGRA"
function calcularKPIsDesdeRangos(data) {
    let totalAspirantes = 0, totalAlumnosBIRED = 0, totalAlumnosEMGRA = 0, totalRescatistas = 0;
    
    data.forEach(item => {
        const rango    = item.rango || '';
        const cantidad = parseInt(item.cantidad) || 0;
        
        // Filtra EXACTAMENTE por los valores que vienen de la BD
        if (rango === 'Aspirante') {
            totalAspirantes += cantidad;
        } else if (rango === 'Alumno - BIRED') {
            totalAlumnosBIRED += cantidad;
        } else if (rango === 'Alumno - EMGRA') {
            totalAlumnosEMGRA += cantidad;
        } else if (rango === 'Rescatista') {
            totalRescatistas += cantidad;
        }
    });
    
    const totalAlumnos = totalAlumnosBIRED + totalAlumnosEMGRA;
    
    console.log('📊 KPIs calculados desde rangos:');
    console.log('  Aspirantes:', totalAspirantes);
    console.log('  Alumnos BIRED:', totalAlumnosBIRED);
    console.log('  Alumnos EMGRA:', totalAlumnosEMGRA);
    console.log('  Total Alumnos:', totalAlumnos);
    console.log('  Rescatistas:', totalRescatistas);
    
    actualizarKPIEspecifico('.kpi-card:nth-child(2) .kpi-value', totalAspirantes);
    actualizarKPIEspecifico('.kpi-card:nth-child(3) .kpi-value', totalAlumnos);
    actualizarKPIEspecifico('.kpi-card:nth-child(4) .kpi-value', totalRescatistas);
    
    const subtituloAlumnos = document.querySelector('.kpi-card:nth-child(3) .kpi-subtitle');
    if (subtituloAlumnos) subtituloAlumnos.textContent = `BIRED: ${totalAlumnosBIRED} | EMGRA: ${totalAlumnosEMGRA}`;
}

function actualizarKPIEspecifico(selector, valor) {
    const elemento = document.querySelector(selector);
    if (elemento) animarContador(elemento, parseInt(elemento.textContent.replace(/,/g, '')) || 0, parseInt(valor) || 0, 1000);
}

function crearGraficoMiembrosRango(labels, valores) {
    const ctx = document.getElementById('chartMiembrosRango');
    if (!ctx) return;
    if (chartMiembrosRango) chartMiembrosRango.destroy();
    
    chartMiembrosRango = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Cantidad de Miembros',
                data: valores,
                backgroundColor: ['rgba(67,233,123,0.8)','rgba(79,172,254,0.8)','rgba(253,183,80,0.8)','rgba(231,76,60,0.8)','rgba(155,89,182,0.8)','rgba(52,152,219,0.8)','rgba(46,204,113,0.8)','rgba(241,196,15,0.8)'],
                borderColor:     ['rgba(67,233,123,1)',  'rgba(79,172,254,1)',  'rgba(253,183,80,1)',  'rgba(231,76,60,1)',  'rgba(155,89,182,1)',  'rgba(52,152,219,1)',  'rgba(46,204,113,1)',  'rgba(241,196,15,1)'],
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, titleFont: { size: 14 }, bodyFont: { size: 13 } } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { font: { size: 12 } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 3. GRÁFICO: MIEMBROS POR ESTADO (DONUT)
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoMiembrosEstado() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/miembros-estado`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) {
            crearGraficoMiembrosEstado(
                result.data.map(i => i.estado   || 'Sin estado'),
                result.data.map(i => i.cantidad || 0)
            );
        }
    } catch (error) { console.error("❌ Error gráfico estados:", error); }
}

function crearGraficoMiembrosEstado(labels, valores) {
    const ctx = document.getElementById('chartMiembrosEstado');
    if (!ctx) return;
    if (chartMiembrosEstado) chartMiembrosEstado.destroy();
    
    chartMiembrosEstado = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: ['rgba(67,233,123,0.8)','rgba(253,183,80,0.8)','rgba(231,76,60,0.8)'],
                borderColor: '#fff', borderWidth: 3, hoverOffset: 10
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 13 }, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)', padding: 12,
                    callbacks: { label: function(ctx) { const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return `${ctx.label}: ${ctx.parsed} (${t>0?((ctx.parsed/t)*100).toFixed(1):0}%)`; } }
                }
            },
            cutout: '65%'
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 4. GRÁFICO: POSTULANTES POR MES (LÍNEA)
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoPostulantesMes() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/postulantes-mes`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) {
            crearGraficoPostulantesMes(
                result.data.map(i => i.mes_label || ''),
                result.data.map(i => i.total     || 0)
            );
        }
    } catch (error) { console.error("❌ Error gráfico postulantes mes:", error); }
}

function crearGraficoPostulantesMes(labels, valores) {
    const ctx = document.getElementById('chartPostulantesMes');
    if (!ctx) return;
    if (chartPostulantesMes) chartPostulantesMes.destroy();
    
    chartPostulantesMes = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Postulantes', data: valores,
                borderColor: 'rgba(79,172,254,1)', backgroundColor: 'rgba(79,172,254,0.1)',
                borderWidth: 3, fill: true, tension: 0.4,
                pointBackgroundColor: 'rgba(79,172,254,1)', pointBorderColor: '#fff',
                pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, titleFont: { size: 14 }, bodyFont: { size: 13 } } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 5. GRÁFICO: MIEMBROS POR DEPARTAMENTO
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoMiembrosDepartamento() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/miembros-departamento`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) {
            crearGraficoMiembrosDepartamento(
                result.data.map(i => i.departamento || 'Sin departamento'),
                result.data.map(i => i.cantidad     || 0)
            );
        }
    } catch (error) { console.error("❌ Error gráfico departamentos:", error); }
}

function crearGraficoMiembrosDepartamento(labels, valores) {
    const ctx = document.getElementById('chartMiembrosDepartamento');
    if (!ctx) return;
    if (chartMiembrosDepartamento) chartMiembrosDepartamento.destroy();
    
    chartMiembrosDepartamento = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Miembros', data: valores, backgroundColor: 'rgba(67,233,123,0.8)', borderColor: 'rgba(67,233,123,1)', borderWidth: 2, borderRadius: 6 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 } },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { ticks: { font: { size: 12 } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 6. GRÁFICO: EDADES DE MIEMBROS
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoEdadesMiembros() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/edades-miembros`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) {
            crearGraficoEdadesMiembros(
                result.data.map(i => i.rango_edad || ''),
                result.data.map(i => i.cantidad   || 0)
            );
        }
    } catch (error) { console.error("❌ Error gráfico edades:", error); }
}

function crearGraficoEdadesMiembros(labels, valores) {
    const ctx = document.getElementById('chartEdadesMiembros');
    if (!ctx) return;
    if (chartEdadesMiembros) chartEdadesMiembros.destroy();
    
    chartEdadesMiembros = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Cantidad', data: valores, backgroundColor: 'rgba(253,183,80,0.8)', borderColor: 'rgba(253,183,80,1)', borderWidth: 2, borderRadius: 8 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { font: { size: 12 } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 7. GRÁFICO: OCUPACIÓN DE CURSOS
// ══════════════════════════════════════════════════════════════════
async function cargarGraficoOcupacionCursos() {
    try {
        const response = await fetch(`${DASHBOARD_API}/graficos/ocupacion-cursos`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) {
            crearGraficoOcupacionCursos(
                result.data.map(i => i.titulo        || 'Sin título'),
                result.data.map(i => parseFloat(i.pct_ocupacion) || 0)
            );
        }
    } catch (error) { console.error("❌ Error gráfico ocupación cursos:", error); }
}

function crearGraficoOcupacionCursos(labels, ocupacion) {
    const ctx = document.getElementById('chartOcupacionCursos');
    if (!ctx) return;
    if (chartOcupacionCursos) chartOcupacionCursos.destroy();
    
    const colores = ocupacion.map(pct => pct >= 90 ? 'rgba(231,76,60,0.8)' : pct >= 70 ? 'rgba(253,183,80,0.8)' : 'rgba(67,233,123,0.8)');
    
    chartOcupacionCursos = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: '% Ocupación', data: ocupacion, backgroundColor: colores, borderColor: colores.map(c => c.replace('0.8','1')), borderWidth: 2, borderRadius: 6 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, callbacks: { label: ctx => `Ocupación: ${ctx.parsed.x.toFixed(1)}%` } } },
            scales: {
                x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { ticks: { font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// 8. ACTIVIDAD RECIENTE
// ══════════════════════════════════════════════════════════════════
async function cargarActividadReciente(top = 15) {
    try {
        const response = await fetch(`${DASHBOARD_API}/actividad-reciente?top=${top}`);
        const result = await response.json();
        if (result.status === "SUCCESS" && result.data) renderActividadReciente(result.data);
    } catch (error) { console.error("❌ Error actividad reciente:", error); }
}

function renderActividadReciente(actividades) {
    const container = document.getElementById('actividadReciente');
    if (!container) return;
    
    if (!actividades || actividades.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-inbox" style="font-size:48px;margin-bottom:10px;"></i><p>No hay actividad reciente</p></div>`;
        return;
    }
    
    container.innerHTML = actividades.map(act => `
        <div class="activity-item">
            <div class="activity-icon ${obtenerColorActividad(act.tipo)}">
                <i class="${obtenerIconoActividad(act.tipo)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${act.descripcion || 'Sin descripción'}</div>
                <div class="activity-meta">
                    <span class="activity-detail">${act.detalle || ''}</span>
                    <span class="activity-time">${formatearFechaActividad(act.fecha)}</span>
                </div>
            </div>
        </div>`).join('');
}

function obtenerIconoActividad(tipo) {
    return ({ postulante:'fas fa-user-plus', miembro:'fas fa-users', historial:'fas fa-history', curso:'fas fa-graduation-cap', evento:'fas fa-calendar-alt', noticia:'fas fa-newspaper' })[tipo?.toLowerCase()] || 'fas fa-circle';
}

function obtenerColorActividad(tipo) {
    return ({ postulante:'activity-icon-blue', miembro:'activity-icon-green', historial:'activity-icon-purple', curso:'activity-icon-orange', evento:'activity-icon-yellow', noticia:'activity-icon-red' })[tipo?.toLowerCase()] || 'activity-icon-gray';
}

function formatearFechaActividad(fecha) {
    if (!fecha) return '';
    const f = new Date(fecha);
    const diff = new Date() - f;
    if (diff < 60000)     return 'Hace un momento';
    if (diff < 3600000)   return `Hace ${Math.floor(diff/60000)} min`;
    if (diff < 86400000)  { const h = Math.floor(diff/3600000);  return `Hace ${h} hora${h>1?'s':''}`; }
    if (diff < 604800000) { const d = Math.floor(diff/86400000); return `Hace ${d} día${d>1?'s':''}`; }
    return f.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ══════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════
function mostrarLoaderDashboard() {
    const loader = document.getElementById('dashboardLoader');
    if (loader) loader.style.display = 'flex';
}

function ocultarLoaderDashboard() {
    const loader = document.getElementById('dashboardLoader');
    if (loader) loader.style.display = 'none';
}

// Guard: solo define showToast si no existe ya (lo define admin-script.js)
if (typeof showToast === 'undefined') {
    function showToast(msg, type) {
        let c = document.getElementById('toastC');
        if (!c) { c = document.createElement('div'); c.id = 'toastC'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;'; document.body.appendChild(c); }
        const colors = { success:'#43e97b', error:'#e74c3c', warning:'#FDB750', info:'#4facfe' };
        const icons  = { success:'check-circle', error:'times-circle', warning:'exclamation-triangle', info:'info-circle' };
        const t = document.createElement('div');
        t.style.cssText = `background:white;padding:15px 20px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;min-width:300px;border-left:4px solid ${colors[type]};animation:slideInR 0.3s ease-out;font-family:sans-serif;font-size:14px;`;
        t.innerHTML = `<i class="fas fa-${icons[type]}" style="color:${colors[type]};font-size:18px;"></i><span style="flex:1;">${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;"><i class="fas fa-times"></i></button>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
    }
    if (!document.getElementById('toastS')) { const s = document.createElement('style'); s.id='toastS'; s.textContent='@keyframes slideInR{from{opacity:0;transform:translateX(100px);}to{opacity:1;transform:translateX(0);}}'; document.head.appendChild(s); }
}

// ══════════════════════════════════════════════════════════════════
// LOG DE DEBUGGING
// ══════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🔥 DASHBOARD API CARGADO CORRECTAMENTE 🔥            ║
╠══════════════════════════════════════════════════════════════╣
║  API Base: ${DASHBOARD_API}
║                                                              ║
║  Endpoints consumidos:                                       ║
║  • /               → KPIs principales                       ║
║  • /graficos/miembros-rango                                  ║
║  • /graficos/miembros-estado                                 ║
║  • /graficos/postulantes-mes                                 ║
║  • /graficos/miembros-departamento                           ║
║  • /graficos/edades-miembros                                 ║
║  • /graficos/ocupacion-cursos                                ║
║  • /actividad-reciente                                       ║
╚══════════════════════════════════════════════════════════════╝
`);