// ============================================
// CGPVP - REPORTES API
// Consumo de endpoints de reportes del panel admin
// Endpoints: /api/admin/reportes/*
// ============================================

const _adminDataRep = JSON.parse(localStorage.getItem('admin_data') || '{}');
const API_REPORTES_BASE = 'https://paramedicosdelperu.org/api/admin/reportes';

// ============================================
// HELPER: fetch con manejo de errores
// ============================================
async function _fetchReporte(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('❌ Error al consumir reporte:', error);
        _notifReporte('Error al obtener los datos del reporte', 'error');
        return null;
    }
}

// ============================================
// HELPER: Mostrar estado de carga en botones
// ============================================
function _setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        btn.disabled = false;
    }
}

// ============================================
// HELPER: Notificaciones (usa showToast del panel)
// ============================================
function _notifReporte(mensaje, tipo = 'info') {
    if (typeof showToast === 'function') {
        showToast(mensaje, tipo);
        return;
    }
    if (typeof showNotification === 'function') {
        showNotification(mensaje, tipo);
        return;
    }
    // Fallback propio
    const n = document.createElement('div');
    n.textContent = mensaje;
    n.style.cssText = `
        position:fixed; top:20px; right:20px; padding:14px 20px;
        background:${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#e74c3c' : '#0055cc'};
        color:#fff; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.18);
        z-index:10000; font-size:14px; font-weight:500;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(n);
    setTimeout(() => { n.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => n.remove(), 300); }, 3500);
}

// ============================================
// HELPER: Exportar array de objetos a CSV
// ============================================
function _exportarCSV(datos, nombreArchivo) {
    if (!datos || !datos.length) {
        _notifReporte('No hay datos para exportar', 'error');
        return;
    }

    const headers = Object.keys(datos[0]);
    const filas   = datos.map(row =>
        headers.map(h => {
            const val = row[h] ?? '';
            // Escapar comas y comillas
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csv  = [headers.join(','), ...filas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    _notifReporte('Excel generado correctamente', 'success');
}

// ============================================
// HELPER: Exportar a PDF usando ventana de impresión
// ============================================
function _exportarPDF(titulo, columnas, filas, subtitulo = '') {
    if (!filas || !filas.length) {
        _notifReporte('No hay datos para exportar', 'error');
        return;
    }

    const filasHtml = filas.map(row =>
        `<tr>${columnas.map(c => `<td>${row[c.key] ?? '-'}</td>`).join('')}</tr>`
    ).join('');

    const headersHtml = columnas.map(c => `<th>${c.label}</th>`).join('');

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${titulo}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a2e; }
                .header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; border-bottom: 3px solid #000033; padding-bottom: 16px; }
                .header-texts h1 { font-size: 20px; color: #000033; font-weight: 700; }
                .header-texts p  { font-size: 12px; color: #666; margin-top: 4px; }
                .badge { background: #000033; color: #FDB750; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
                thead tr { background: #000033; color: #FDB750; }
                thead th { padding: 10px 12px; text-align: left; font-weight: 600; }
                tbody tr:nth-child(even) { background: #f4f6fb; }
                tbody td { padding: 9px 12px; border-bottom: 1px solid #e8edf5; color: #333; }
                .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: right; }
                @media print {
                    body { padding: 16px; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-texts">
                    <h1>CGPVP — ${titulo}</h1>
                    <p>${subtitulo || 'Cuerpo General de Paramédicos Voluntarios del Perú'}</p>
                </div>
            </div>
            <span class="badge">Total: ${filas.length} registros</span>
            <table>
                <thead><tr>${headersHtml}</tr></thead>
                <tbody>${filasHtml}</tbody>
            </table>
            <div class="footer">
                Generado el ${new Date().toLocaleString('es-PE')} 
                por ${_adminDataRep.nombre_completo || 'Administrador'}
            </div>
            <script>
                window.onload = function() { window.print(); };
            <\/script>
        </body>
        </html>
    `);
    ventana.document.close();
    _notifReporte('PDF abierto para imprimir', 'success');
}


// ============================================
// 1️⃣ REPORTE: MIEMBROS POR ESTADO
// Endpoint: GET /api/admin/reportes/miembros-estado
// ============================================
window.reporteMiembrosEstado = async function(formato) {
    const btn = event?.target?.closest('button');
    _setBtnLoading(btn, true);

    try {
        console.log('📡 Cargando reporte miembros por estado...');
        const res = await _fetchReporte(`${API_REPORTES_BASE}/miembros-estado`);
        if (!res || !res.data?.length) {
            _notifReporte('No se encontraron datos', 'error');
            return;
        }

        if (formato === 'excel') {
            _exportarCSV(res.data, 'miembros_por_estado');
        } else {
            _exportarPDF(
                'Miembros por Estado',
                [
                    { key: 'estado',      label: 'Estado'      },
                    { key: 'total',       label: 'Total'        },
                    { key: 'porcentaje',  label: 'Porcentaje %' },
                ],
                res.data,
                `Total registros: ${res.total}`
            );
        }
    } finally {
        _setBtnLoading(btn, false);
    }
};


// ============================================
// 2️⃣ REPORTE: POSTULANTES POR PERÍODO
// Endpoint: GET /api/admin/reportes/postulantes-periodo
// ============================================
window.reportePostulantesPeriodo = async function(tipo, valor, formato) {
    const btn = event?.target?.closest('button');
    _setBtnLoading(btn, true);

    try {
        console.log(`📡 Cargando reporte postulantes — tipo: ${tipo}, valor: ${valor}`);
        const url = `${API_REPORTES_BASE}/postulantes-periodo?tipo_periodo=${tipo}&valor=${encodeURIComponent(valor)}`;
        const res = await _fetchReporte(url);
        if (!res || !res.data?.length) {
            _notifReporte('No hay postulantes en el período seleccionado', 'error');
            return;
        }

        // Subtítulo dinámico según tipo
        const labels = { dia: 'Día', mes: 'Mes', anio: 'Año' };
        const subtitulo = `${labels[tipo] || 'Período'}: ${valor} — Total: ${res.total}`;

        if (formato === 'excel') {
            _exportarCSV(res.data, `postulantes_${tipo}_${valor}`);
        } else {
            _exportarPDF(
                'Postulantes por Período',
                [
                    { key: 'nombre_completo', label: 'Nombre'          },
                    { key: 'dni',             label: 'DNI'              },
                    { key: 'email',           label: 'Email'            },
                    { key: 'telefono',        label: 'Teléfono'         },
                    { key: 'departamento',    label: 'Departamento'     },
                    { key: 'profesion',       label: 'Profesión'        },
                    { key: 'fecha_registro',  label: 'Fecha Registro'   },
                ],
                res.data,
                subtitulo
            );
        }
    } finally {
        _setBtnLoading(btn, false);
    }
};


// ============================================
// 3️⃣ REPORTE: POSTULANTES POR DEPARTAMENTO
// Endpoint: GET /api/admin/reportes/postulantes-departamento
// ============================================
window.reportePostulantesDepartamento = async function(formato) {
    const btn = event?.target?.closest('button');
    _setBtnLoading(btn, true);

    try {
        console.log('📡 Cargando reporte postulantes por departamento...');
        const res = await _fetchReporte(`${API_REPORTES_BASE}/postulantes-departamento`);
        if (!res || !res.data?.length) {
            _notifReporte('No se encontraron datos', 'error');
            return;
        }

        if (formato === 'excel') {
            _exportarCSV(res.data, 'postulantes_por_departamento');
        } else {
            _exportarPDF(
                'Postulantes por Departamento',
                [
                    { key: 'departamento', label: 'Departamento'  },
                    { key: 'total',        label: 'Total'          },
                    { key: 'porcentaje',   label: 'Porcentaje %'   },
                ],
                res.data,
                `Total registros: ${res.total}`
            );
        }
    } finally {
        _setBtnLoading(btn, false);
    }
};


// ============================================
// 4️⃣ REPORTE: POSTULANTES POR PROFESIÓN
// Endpoint: GET /api/admin/reportes/postulantes-profesion
// ============================================
window.reportePostulantesProfesion = async function(formato) {
    const btn = event?.target?.closest('button');
    _setBtnLoading(btn, true);

    try {
        console.log('📡 Cargando reporte postulantes por profesión...');
        const res = await _fetchReporte(`${API_REPORTES_BASE}/postulantes-profesion`);
        if (!res || !res.data?.length) {
            _notifReporte('No se encontraron datos', 'error');
            return;
        }

        if (formato === 'excel') {
            _exportarCSV(res.data, 'postulantes_por_profesion');
        } else {
            _exportarPDF(
                'Postulantes por Profesión',
                [
                    { key: 'profesion',   label: 'Profesión'     },
                    { key: 'total',       label: 'Total'          },
                    { key: 'porcentaje',  label: 'Porcentaje %'   },
                ],
                res.data,
                `Total profesiones distintas: ${res.total}`
            );
        }
    } finally {
        _setBtnLoading(btn, false);
    }
};


// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 reportes-api.js inicializado correctamente.');

    // Setear fecha por defecto al input de período
    const inputFecha = document.getElementById('reportPeriodoFecha');
    if (inputFecha && !inputFecha.value) {
        inputFecha.value = new Date().toISOString().slice(0, 7); // mes actual
    }
});

// ============================================
// CSS ANIMACIONES (por si no están en admin-styles.css)
// ============================================
if (!document.getElementById('reportes-api-styles')) {
    const s = document.createElement('style');
    s.id = 'reportes-api-styles';
    s.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(110%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0);    opacity: 1; }
            to   { transform: translateX(110%); opacity: 0; }
        }
    `;
    document.head.appendChild(s);
}