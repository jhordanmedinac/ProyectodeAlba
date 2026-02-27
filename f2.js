// ============ SCRIPT DE PROTECCIÓN ANTI-INSPECCIÓN ============

        function createProtectionElements() {
            const style = document.createElement('style');
            style.textContent = `
                .protection-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(160deg, #0a0a0a 0%, #1a0000 60%, #0d0d0d 100%);
                    color: white;
                    padding: 40px 45px;
                    border-radius: 8px;
                    border: 1px solid #8b0000;
                    box-shadow: 0 0 0 1px rgba(139,0,0,0.3), 0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(139,0,0,0.2);
                    z-index: 10000;
                    text-align: center;
                    font-family: 'Courier New', Courier, monospace;
                    animation: popupSlide 0.25s ease-out;
                    display: none;
                    min-width: 380px;
                    max-width: 460px;
                }

                .protection-popup::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #8b0000, #cc0000, #8b0000, transparent);
                    border-radius: 8px 8px 0 0;
                }

                .prot-header-bar {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 18px;
                    padding-bottom: 14px;
                    border-bottom: 1px solid rgba(139,0,0,0.4);
                }

                .prot-badge {
                    background: #8b0000;
                    color: #fff;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    padding: 3px 10px;
                    border-radius: 3px;
                    text-transform: uppercase;
                }

                .prot-img-container {
                    width: 90px;
                    height: 90px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #8b0000;
                    box-shadow: 0 0 20px rgba(139,0,0,0.5), 0 0 40px rgba(139,0,0,0.2);
                    background: #111;
                }

                .prot-img-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: grayscale(30%) brightness(0.85);
                }

                .prot-title {
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: #cc0000;
                    margin-bottom: 10px;
                }

                .prot-code {
                    font-size: 10px;
                    color: rgba(139,0,0,0.6);
                    letter-spacing: 2px;
                    margin-bottom: 18px;
                    font-family: 'Courier New', monospace;
                }

                .protection-popup .message {
                    font-size: 13px;
                    line-height: 1.8;
                    color: #ccc;
                    margin-bottom: 24px;
                    padding: 14px 16px;
                    background: rgba(139,0,0,0.08);
                    border-left: 3px solid #8b0000;
                    border-radius: 0 4px 4px 0;
                    text-align: left;
                }

                .prot-warning-line {
                    color: #ff4444;
                    font-weight: 700;
                    font-size: 12px;
                    letter-spacing: 1px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .prot-warning-line i { font-size: 11px; }

                .prot-info-line {
                    color: #999;
                    font-size: 12px;
                    margin-top: 8px;
                }

                .protection-popup .close-btn {
                    background: transparent;
                    border: 1px solid rgba(139,0,0,0.6);
                    color: #999;
                    padding: 10px 28px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }

                .protection-popup .close-btn:hover {
                    background: rgba(139,0,0,0.15);
                    border-color: #cc0000;
                    color: #fff;
                }

                .prot-counter {
                    font-size: 10px;
                    color: rgba(139,0,0,0.5);
                    margin-top: 14px;
                    letter-spacing: 1px;
                    font-family: 'Courier New', monospace;
                }

                .protection-overlay {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 9999;
                    display: none;
                    backdrop-filter: blur(4px);
                }

                @keyframes popupSlide {
                    from { opacity: 0; transform: translate(-50%, -58%) scale(0.92); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.3; }
                }

                .prot-blink { animation: blink 1.2s infinite; }

                * {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
            `;
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.className = 'protection-overlay';
            overlay.id = 'protectionOverlay';
            document.body.appendChild(overlay);

            const popup = document.createElement('div');
            popup.className = 'protection-popup';
            popup.id = 'protectionPopup';
            popup.innerHTML = `
                <div class="prot-header-bar">
                    <span class="prot-badge prot-blink">
                        <i class="fas fa-circle" style="font-size:7px;margin-right:5px"></i> ALERTA DE SEGURIDAD
                    </span>
                </div>

                <div class="prot-img-container">
                    <img src="../IMAGENES/LOGO.png" alt="Logo" id="protLogo">
                </div>

                <div class="prot-title">Acceso No Autorizado</div>
                <div class="prot-code">[ CÓDIGO: ERR-403-SEC ]</div>

                <div class="message">
                    <div class="prot-warning-line">
                        <i class="fas fa-exclamation-triangle"></i>
                        ADVERTENCIA DEL SISTEMA
                    </div>
                    Esta acción ha sido registrada y está siendo monitoreada. El acceso no autorizado al código fuente, inspección de elementos o extracción de contenido de esta plataforma constituye una violación a los términos de uso y puede tener consecuencias legales.
                    <div class="prot-info-line">
                        <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#8b0000"></i>
                        Actividad registrada — IP y sesión identificadas.
                    </div>
                </div>

                <button class="close-btn" onclick="closeProtectionPopup()">
                    <i class="fas fa-times" style="margin-right:8px"></i> Entendido
                </button>
                <div class="prot-counter" id="protCountdown">Cerrando en 9 segundos...</div>
                <div style="margin-top:20px;padding-top:14px;border-top:1px solid rgba(139,0,0,0.2);font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:2px;font-family:'Courier New',monospace;">
    POWERED BY <a href="https://www.linkedin.com/in/alba-ingeniería-de-desarrollo-42a3493ab/" target="_blank" style="color:rgba(139,0,0,0.5);text-decoration:none;letter-spacing:2px;">ALBA</a>
</div>
            `;
            document.body.appendChild(popup);
        }

        let countdownInterval = null;

        function showProtectionPopup() {
            const overlay = document.getElementById('protectionOverlay');
            const popup  = document.getElementById('protectionPopup');
            const countdown = document.getElementById('protCountdown');

            if (overlay && popup) {
                overlay.style.display = 'block';
                popup.style.display   = 'block';

                let seconds = 9;
                if (countdown) countdown.textContent = `Cerrando en ${seconds} segundos...`;

                if (countdownInterval) clearInterval(countdownInterval);
                countdownInterval = setInterval(() => {
                    seconds--;
                    if (countdown) countdown.textContent = `Cerrando en ${seconds} segundos...`;
                    if (seconds <= 0) {
                        clearInterval(countdownInterval);
                        closeProtectionPopup();
                    }
                }, 1000);
            }
        }

        function closeProtectionPopup() {
            const overlay = document.getElementById('protectionOverlay');
            const popup  = document.getElementById('protectionPopup');
            if (countdownInterval) clearInterval(countdownInterval);
            if (overlay && popup) {
                overlay.style.display = 'none';
                popup.style.display   = 'none';
            }
        }

        function initKeyboardProtection() {
            document.addEventListener('keydown', function(e) {
                if (e.keyCode === 123) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.keyCode === 65) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
                if (e.ctrlKey && e.keyCode === 80) { e.preventDefault(); e.stopPropagation(); showProtectionPopup(); return false; }
            });
        }

        function initContextMenuProtection() {
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault(); e.stopPropagation();
                showProtectionPopup(); return false;
            });
        }

        function initTextSelectionProtection() {
            document.onselectstart = function(e) { e.preventDefault(); return false; };
            document.onmousedown   = function(e) {
                if (e.button === 2) { e.preventDefault(); showProtectionPopup(); return false; }
            };
        }

        function initDragProtection() {
            document.addEventListener('dragstart', function(e) {
                e.preventDefault(); showProtectionPopup(); return false;
            });
        }

        function initDevToolsDetection() {
            let devToolsOpen = false;
            const threshold  = 160;
            function detectDevTools() {
                if ((window.outerHeight - window.innerHeight) > threshold ||
                    (window.outerWidth  - window.innerWidth)  > threshold) {
                    if (!devToolsOpen) {
                        devToolsOpen = true;
                        showProtectionPopup();
                        console.clear();
                        console.log("%c SISTEMA PROTEGIDO", "color:#cc0000;font-size:22px;font-weight:bold;font-family:monospace;");
                        console.log("%c Acceso no autorizado detectado. Esta actividad ha sido registrada.", "color:#999;font-size:13px;font-family:monospace;");
                        console.log("%c [ ERR-403-SEC ] Cierre las herramientas de desarrollador.", "color:#666;font-size:12px;font-family:monospace;");
                    }
                } else {
                    devToolsOpen = false;
                }
            }
            setInterval(detectDevTools, 100);
        }

        function initConsoleProtection() {}

        function initProtection() {
            createProtectionElements();
            initKeyboardProtection();
            initContextMenuProtection();
            initTextSelectionProtection();
            initDragProtection();
            initDevToolsDetection();
            initConsoleProtection();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initProtection);
        } else {
            initProtection();
        }

        (function() {
            'use strict';
            Object.freeze(Object.prototype);
            setTimeout(initProtection, 100);
        })();